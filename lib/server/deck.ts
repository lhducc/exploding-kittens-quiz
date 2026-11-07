import { randomInt } from "node:crypto";
import type { Card } from "../game-view.ts";

const values = [1, 2, 3, 5] as const;
type Profile = [cap: number, safeDraws: number];
export type Deck = { cap: number; cards: Card[] };

function feasible(points: number, draws: number, memo: Map<string, boolean>): boolean {
  if (draws === 0) return points === 0;
  if (points < draws || points > draws * 5) return false;
  const key = points + "/" + draws;
  const known = memo.get(key);
  if (known !== undefined) return known;
  const result = values.some(value => feasible(points - value, draws - 1, memo));
  memo.set(key, result);
  return result;
}

export function parseProfiles(input: string | undefined): Profile[] {
  const error = new Error("QUIZ_DRAW_PROFILES cần đúng 10 cặp điểm và lượt rút khả thi.");
  let raw: unknown;
  try {
    raw = JSON.parse(input ?? "");
  } catch {
    throw error;
  }
  if (!Array.isArray(raw) || raw.length !== 10) throw error;
  return raw.map(pair => {
    if (!Array.isArray(pair) || pair.length !== 2) throw error;
    const [cap, draws] = pair;
    if (!Number.isInteger(cap) || !Number.isInteger(draws) || draws < 1 || draws > 20 ||
        !feasible(cap, draws, new Map())) throw error;
    return [cap, draws];
  });
}

export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = randomInt(index + 1);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export function deal(profiles: Profile[]): Deck[] {
  return shuffle(profiles).map(([cap, safeDraws]) => {
    const cards: Card[] = [];
    const memo = new Map<string, boolean>();
    let points = cap;
    for (let draws = safeDraws; draws > 0; draws--) {
      const options = values.filter(value => feasible(points - value, draws - 1, memo));
      const card = options[randomInt(options.length)];
      cards.push(card);
      points -= card;
    }
    cards.push("bomb");
    return { cap, cards };
  });
}
