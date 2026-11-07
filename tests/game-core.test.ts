import assert from "node:assert/strict";
import { test } from "node:test";
import { questions } from "../lib/questions.ts";
import type { GameAction } from "../lib/game-view.ts";
import { parseProfiles } from "../lib/server/deck.ts";
import { applyAction, gameView, newGame } from "../lib/server/game.ts";

const profiles = parseProfiles(JSON.stringify(Array.from({ length: 10 }, () => [9, 5])));

test("uses the ten approved questions and answer key", () => {
  assert.equal(questions.length, 10);
  assert.deepEqual(questions.map(q => q.answer), ["B", "D", "A", "C", "B", "A", "D", "C", "B", "A"]);
});

test("wrong answers close the question, and only correct answers unlock drawing", () => {
  let state = newGame(profiles);
  assert.equal(applyAction(state, { action: "draw" }), null);
  state = applyAction(state, { action: "select", questionId: "01" })!;
  assert.equal(gameView(state, 2).question?.correctChoice, undefined);
  state = applyAction(state, { action: "answer", choice: "A" })!;
  assert.equal(gameView(state, 3).feedback?.points, 0);
  assert.equal(gameView(state, 3).question?.correctChoice, "B");
  assert.equal(applyAction(state, { action: "enterDraw" }), null);
  state = applyAction(state, { action: "continue" })!;
  assert.equal(applyAction(state, { action: "select", questionId: "01" }), null);
});

test("safe cards are displayed individually, and a bomb leaves previous points intact", () => {
  let state = newGame(profiles);
  for (const id of ["01", "02"]) state.rounds[id].deck.cards = [3, 2, 1, 1, 2, "bomb"];
  function act(action: GameAction) {
    const next = applyAction(state, action);
    assert.ok(next, action.action);
    state = next;
  }
  act({ action: "select", questionId: "01" });
  act({ action: "answer", choice: "B" });
  act({ action: "enterDraw" });
  assert.deepEqual(gameView(state, 1).draw, { points: 0, current: null, preview: null, defuseOn: false });
  act({ action: "draw" });
  act({ action: "draw" });
  assert.deepEqual(gameView(state, 1).draw, { points: 5, current: 2, preview: null, defuseOn: false });
  act({ action: "stop" });
  assert.equal(gameView(state, 1).totalPoints, 5);
  assert.equal(applyAction(state, { action: "stop" }), null);
  act({ action: "continue" });
  act({ action: "select", questionId: "02" });
  act({ action: "answer", choice: "D" });
  act({ action: "enterDraw" });
  for (let i = 0; i < 5; i++) act({ action: "draw" });
  assert.equal(gameView(state, 1).draw?.points, 9);
  act({ action: "draw" });
  const result = gameView(state, 1);
  assert.deepEqual(result.feedback, { outcome: "bomb", points: 0 });
  assert.equal(result.draw?.current, "bomb");
  assert.equal(result.draw?.points, 0);
  assert.equal(result.totalPoints, 5);
  assert.doesNotMatch(JSON.stringify(result), /"deck"|"cards"|"cap"|"cursor"|"safeDraws"/);
});
