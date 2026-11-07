import { letters } from "../game-view.ts";
import type { Card, GameAction, GameView, Letter, Outcome, Screen, SpellCounts } from "../game-view.ts";
import { questions } from "../questions.ts";
import { deal, shuffle } from "./deck.ts";
import type { Deck, parseProfiles } from "./deck.ts";

type Round = {
  deck: Deck;
  chosen: Letter | null;
  removed: Letter[];
  score: number | null;
  outcome: Outcome | null;
  cursor: number;
  current: Card | null;
  preview: Card | null;
  points: number;
  defuseOn: boolean;
};

export type GameState = {
  screen: Screen;
  active: string | null;
  rounds: Record<string, Round>;
  spells: SpellCounts;
};

export function newGame(profiles: ReturnType<typeof parseProfiles>): GameState {
  const decks = deal(profiles);
  const rounds = Object.fromEntries(questions.map(({ id }, index) => [id, {
    deck: decks[index], chosen: null, removed: [], score: null, outcome: null,
    cursor: 0, current: null, preview: null, points: 0, defuseOn: false,
  } satisfies Round]));
  return {
    screen: "board", active: null, rounds,
    spells: { fiftyFifty: 2, defuse: 1, peek: 3, double: 1 },
  };
}

function finish(state: GameState, round: Round, outcome: Outcome, score: number) {
  round.score = score;
  round.outcome = outcome;
  round.defuseOn = false;
  round.preview = null;
  state.screen = "feedback";
  return state;
}

export function applyAction(previous: GameState, action: GameAction): GameState | null {
  const state = structuredClone(previous);
  if (action.action === "select") {
    if (state.screen !== "board" || !questions.some(q => q.id === action.questionId) ||
        state.rounds[action.questionId].score !== null) return null;
    state.active = action.questionId;
    state.screen = "question";
    return state;
  }

  const question = questions.find(q => q.id === state.active);
  if (!question) return null;
  const round = state.rounds[question.id];

  switch (action.action) {
    case "answer":
      if (state.screen !== "question" || round.removed.includes(action.choice)) return null;
      round.chosen = action.choice;
      if (action.choice !== question.answer) return finish(state, round, "wrong", 0);
      state.screen = "correct";
      return state;

    case "enterDraw":
      if (state.screen !== "correct") return null;
      state.screen = "draw";
      return state;

    case "fiftyFifty":
      if (state.screen !== "question" || !state.spells.fiftyFifty || round.removed.length) return null;
      round.removed = shuffle(letters.filter(letter => letter !== question.answer)).slice(0, 2);
      state.spells.fiftyFifty--;
      return state;

    case "toggleDefuse":
      if (state.screen !== "draw" || !state.spells.defuse) return null;
      round.defuseOn = !round.defuseOn;
      return state;

    case "peek":
      if (state.screen !== "draw") return null;
      if (round.preview !== null) return state;
      if (!state.spells.peek) return null;
      round.preview = round.deck.cards[round.cursor];
      state.spells.peek--;
      return state;

    case "double":
      if (state.screen !== "draw" || !state.spells.double || !round.points) return null;
      state.spells.double--;
      return finish(state, round, "doubled", round.points * 2);

    case "draw": {
      if (state.screen !== "draw") return null;
      const card = round.deck.cards[round.cursor];
      round.cursor++;
      round.current = card;
      round.preview = null;
      if (card === "bomb") {
        if (round.defuseOn && state.spells.defuse) {
          state.spells.defuse--;
          return finish(state, round, "defused", round.points);
        }
        round.points = 0;
        return finish(state, round, "bomb", 0);
      }
      round.points += card;
      return state;
    }

    case "stop":
      if (state.screen !== "draw") return null;
      return finish(state, round, "stopped", round.points);

    case "continue":
      if (state.screen !== "feedback") return null;
      state.active = null;
      state.screen = Object.values(state.rounds).every(item => item.score !== null) ? "results" : "board";
      return state;

    default:
      return null;
  }
}

export function completedScore(state: GameState): number | null {
  const rounds = Object.values(state.rounds);
  return rounds.every(round => round.score !== null)
    ? rounds.reduce((sum, round) => sum + (round.score ?? 0), 0)
    : null;
}

export function gameView(state: GameState, version: number): GameView {
  const scores = questions.map(({ id }) => ({ id, points: state.rounds[id].score }));
  const view: GameView = {
    version,
    screen: state.screen,
    totalPoints: scores.reduce((sum, { points }) => sum + (points ?? 0), 0),
    questions: scores,
    spells: { ...state.spells },
  };
  const question = questions.find(q => q.id === state.active);
  if (!question) return view;
  const round = state.rounds[question.id];

  if (state.screen === "question" || state.screen === "correct" || round.outcome === "wrong") {
    view.question = {
      id: question.id, part: question.part, text: question.text, choices: question.choices,
      removed: [...round.removed], selected: round.chosen,
    };
    if (round.chosen) view.question.correctChoice = question.answer;
  }
  if (state.screen === "draw" || (state.screen === "feedback" && round.outcome !== "wrong")) {
    view.draw = {
      points: round.points, current: round.current, preview: round.preview, defuseOn: round.defuseOn,
    };
  }
  if (round.outcome && round.score !== null) {
    view.feedback = { outcome: round.outcome, points: round.score };
  }
  return view;
}
