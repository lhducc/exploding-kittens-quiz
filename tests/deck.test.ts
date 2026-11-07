import assert from "node:assert/strict";
import { test } from "node:test";
import { deal, parseProfiles } from "../lib/server/deck.ts";

const fixture = "[[5,2],[6,3],[7,3],[7,4],[8,3],[8,4],[9,4],[9,5],[10,4],[11,5]]";

test("every run has the same caps and the exact safe deck for each profile", () => {
  const profiles = parseProfiles(fixture);
  for (let trial = 0; trial < 12; trial++) {
    const decks = deal(profiles);
    assert.equal(decks.reduce((sum, deck) => sum + deck.cap, 0), 80);
    assert.deepEqual(decks.map(deck => [deck.cap, deck.cards.length - 1].join("/")).sort(),
      profiles.map(profile => profile.join("/")).sort());
    for (const { cap, cards } of decks) {
      assert.equal(cards.at(-1), "bomb");
      assert.ok(cards.slice(0, -1).every(card => card === 1 || card === 2 || card === 3 || card === 5));
      assert.equal(cards.reduce<number>((sum, card) => sum + (typeof card === "number" ? card : 0), 0), cap);
    }
  }
});

test("invalid or impossible configurations are rejected", () => {
  for (const value of ["[]", "oops", fixture.replace("[5,2]", "[9,2]"), fixture.replace("[5,2]", "[21,21]"),
    fixture.replace("[5,2]", "[5,2.5]"), fixture.replace("[5,2]", "[0,2]")]) {
    assert.throws(() => parseProfiles(value), /QUIZ_DRAW_PROFILES/);
  }
});
