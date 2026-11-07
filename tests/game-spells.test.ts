import assert from "node:assert/strict";
import { test } from "node:test";
import type { Card, GameAction } from "../lib/game-view.ts";
import { parseProfiles } from "../lib/server/deck.ts";
import { applyAction, gameView, newGame } from "../lib/server/game.ts";

const profiles = parseProfiles(JSON.stringify(Array.from({ length: 10 }, () => [9, 5])));

function setup(cards: Card[] = [3, 2, 1, 1, 2, "bomb"]) {
  let state = newGame(profiles);
  state.rounds["01"].deck.cards = cards;
  const act = (action: GameAction) => {
    const next = applyAction(state, action);
    if (next) state = next;
    return next;
  };
  const view = () => gameView(state, 1);
  const drawPhase = () => {
    assert.ok(act({ action: "answer", choice: "B" }));
    assert.ok(act({ action: "enterDraw" }));
  };
  act({ action: "select", questionId: "01" });
  return { act, view, drawPhase };
}

test("50/50 spends one use, leaves the answer and blocks removed choices", () => {
  const { act, view } = setup();
  assert.deepEqual(view().spells, { fiftyFifty: 2, defuse: 1, peek: 3, double: 1 });
  assert.ok(act({ action: "fiftyFifty" }));
  const removed = view().question?.removed ?? [];
  assert.equal(new Set(removed).size, 2);
  assert.ok(!removed.includes("B"));
  assert.equal(act({ action: "answer", choice: removed[0] }), null);
  assert.equal(act({ action: "fiftyFifty" }), null);
  assert.equal(view().spells.fiftyFifty, 1);
});

test("Gỡ Bom can toggle, stays active on points and is only consumed by a bomb", () => {
  const { act, view, drawPhase } = setup();
  drawPhase();
  act({ action: "toggleDefuse" });
  act({ action: "toggleDefuse" });
  assert.equal(view().draw?.defuseOn, false);
  act({ action: "toggleDefuse" });
  for (let i = 0; i < 5; i++) act({ action: "draw" });
  assert.equal(view().draw?.defuseOn, true);
  assert.equal(view().spells.defuse, 1);
  act({ action: "draw" });
  assert.deepEqual(view().feedback, { outcome: "defused", points: 9 });
  assert.equal(view().draw?.current, "bomb");
  assert.equal(view().spells.defuse, 0);

  const other = setup();
  other.drawPhase();
  other.act({ action: "toggleDefuse" });
  other.act({ action: "stop" });
  assert.equal(other.view().spells.defuse, 1);
  assert.equal(other.view().draw?.defuseOn, false);
});

test("Xem Trước reveals a single card and doesn't spend twice on it", () => {
  const { act, view, drawPhase } = setup();
  drawPhase();
  assert.ok(act({ action: "peek" }));
  assert.deepEqual(view().draw, { current: null, preview: 3, points: 0, defuseOn: false });
  assert.equal(view().spells.peek, 2);
  act({ action: "peek" });
  assert.equal(view().spells.peek, 2);
  act({ action: "draw" });
  assert.deepEqual(view().draw, { current: 3, preview: null, points: 3, defuseOn: false });
  for (let i = 0; i < 4; i++) act({ action: "draw" });
  assert.ok(act({ action: "peek" }));
  assert.equal(view().draw?.preview, "bomb");
  assert.equal(view().draw?.points, 9);
});

test("Chốt Gấp Đôi turns 8 into 16 even beyond the draw cap, and closes the round", () => {
  const { act, view, drawPhase } = setup([3, 2, 1, 2, 1, "bomb"]);
  drawPhase();
  assert.equal(act({ action: "double" }), null);
  for (let i = 0; i < 4; i++) act({ action: "draw" });
  assert.equal(view().draw?.points, 8);
  assert.ok(act({ action: "double" }));
  assert.equal(view().spells.double, 0);
  assert.deepEqual(view().feedback, { outcome: "doubled", points: 16 });
  assert.equal(view().totalPoints, 16);
  assert.equal(act({ action: "draw" }), null);
});
