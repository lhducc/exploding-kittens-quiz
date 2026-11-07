export const letters = ["A", "B", "C", "D"] as const;
export const roomPinPattern = "[A-Za-z0-9]{6}";
const roomPin = new RegExp(`^${roomPinPattern}$`);

export function isRoomPin(value: unknown): value is string {
  return typeof value === "string" && value.length === 6 && roomPin.test(value);
}

export type Letter = typeof letters[number];
export type Card = 1 | 2 | 3 | 5 | "bomb";
export type Screen = "board" | "question" | "correct" | "draw" | "feedback" | "results";
export type SpellCounts = { fiftyFifty: number; defuse: number; peek: number; double: number };
export type Outcome = "wrong" | "stopped" | "bomb" | "defused" | "doubled";
export type PlayerView = { name: string; bestScore: number | null };
export type Ranking = { page: number; hasMore: boolean; rows: { rank: number; name: string; score: number; completedAt: string }[] };

export type GameView = {
  version: number;
  screen: Screen;
  totalPoints: number;
  questions: { id: string; points: number | null }[];
  spells: SpellCounts;
  question?: {
    id: string;
    part: "I" | "II";
    text: string;
    choices: Record<Letter, string>;
    removed: Letter[];
    selected: Letter | null;
    correctChoice?: Letter;
  };
  draw?: { points: number; current: Card | null; preview: Card | null; defuseOn: boolean };
  feedback?: { outcome: Outcome; points: number };
};

export type GameAction =
  | { action: "select"; questionId: string }
  | { action: "answer"; choice: Letter }
  | { action: "fiftyFifty" | "enterDraw" | "toggleDefuse" | "peek" | "draw" | "stop" | "double" | "continue" | "replay" };

export type JoinAction = { action: "join"; name: string; pin: string };
