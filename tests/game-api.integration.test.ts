import assert from "node:assert/strict";
import { createHmac, randomBytes, randomInt } from "node:crypto";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { after, before, test } from "node:test";
import next from "next";
import { Client } from "pg";
import type { GameAction, GameView, PlayerView, Ranking } from "../lib/game-view.ts";
import { questions } from "../lib/questions.ts";

let url: string;
let cookie: string;
let game: GameView;
let player: PlayerView;
const pin = String(randomInt(100000, 1000000));
const tag = randomBytes(4).toString("hex");
const names = ["Ánh " + tag, "Nam " + tag, "Mai " + tag, "Sơn " + tag];
const pinKey = createHmac("sha256", pin).update("local-or-unknown").digest("hex");
process.env.ROOM_PIN = pin;
const app = next({ dev: false, quiet: true });
const server = createServer(app.getRequestHandler());

before(async () => {
  assert.ok(process.env.DATABASE_URL, "Set DATABASE_URL and apply the migration before integration tests.");
  await app.prepare();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  url = "http://127.0.0.1:" + address.port;
});

after(async () => {
  server.closeAllConnections();
  server.close();
  await app.close();
  const database = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await database.connect();
    await database.query("DELETE FROM game_sessions WHERE player_key = ANY($1)", [names.map(name => name.toLowerCase())]);
    await database.query("DELETE FROM quiz_pin_attempts WHERE address_hash = $1", [pinKey]);
  } finally {
    await database.end();
  }
});

function post(action: Record<string, unknown>, origin = url) {
  return fetch(url + "/api/game", {
    method: "POST",
    headers: { origin, "content-type": "application/json", cookie: cookie ?? "" },
    body: JSON.stringify(action),
  });
}

async function act(action: GameAction) {
  const response = await post({ ...action, expectedVersion: game.version });
  assert.equal(response.status, 200, await response.clone().text());
  game = (await response.json()).game;
  return game;
}

async function openFirstQuestion() {
  await act({ action: "select", questionId: "01" });
  await act({ action: "answer", choice: "B" });
  await act({ action: "enterDraw" });
}

async function startSession(name: string) {
  cookie = "";
  const response = await post({ action: "join", name, pin });
  assert.equal(response.status, 200, await response.clone().text());
  cookie = (response.headers.get("set-cookie") ?? "").split(";")[0];
  ({ game, player } = await response.json());
  return response;
}

test("same-origin API authorizes its own transitions and only one concurrent draw", async () => {
  assert.equal((await post({ action: "join", name: names[0], pin }, "https://other.invalid")).status, 403);
  assert.equal((await post({ action: "join", name: names[0], pin, points: 999 })).status, 400);
  assert.equal((await post({ action: "draw", expectedVersion: 1 })).status, 401);
  assert.equal((await fetch(url + "/api/game?rank=1")).status, 401);
  assert.equal((await post({ action: "join", name: names[0], pin: "000000" })).status, 401);
  const initial = await startSession(names[0]);
  assert.match(initial.headers.get("cache-control") ?? "", /no-store/);
  const setCookie = initial.headers.get("set-cookie") ?? "";
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=lax/i);
  const open = await post({ action: "draw", expectedVersion: game.version });
  assert.equal(open.status, 409);
  await openFirstQuestion();

  const draw = { action: "draw", expectedVersion: game.version };
  const responses = await Promise.all([post(draw), post(draw)]);
  assert.deepEqual(responses.map(item => item.status).sort(), [200, 409]);
  const views = await Promise.all(responses.map(item => item.json()));
  assert.deepEqual(views[0].game, views[1].game);
  assert.equal(views[0].game.version, game.version + 1);
  game = views[0].game;
  assert.ok(game.draw && game.draw.current === game.draw.points);
  assert.doesNotMatch(JSON.stringify(game), /"deck"|"cards"|"cap"|"cursor"|"safeDraws"/);
  cookie = "";
  assert.equal((await post({ action: "join", name: names[0].toUpperCase(), pin })).status, 409);
});

async function finishWithWrongAnswers(from: number) {
  for (const question of questions.slice(from)) {
    await act({ action: "select", questionId: question.id });
    await act({ action: "answer", choice: question.answer === "A" ? "B" : "A" });
    await act({ action: "continue" });
  }
}

async function readPlayer(): Promise<PlayerView> {
  return (await (await fetch(url + "/api/game", { headers: { cookie } })).json()).player;
}

test("reload restores the next card, and completed runs keep the higher leaderboard score", async () => {
  await startSession(names[1]);
  assert.deepEqual(player, { name: names[1], bestScore: null });
  await openFirstQuestion();
  const peek = await act({ action: "peek" });
  assert.equal(peek.spells.peek, 2);
  const recovered = await fetch(url + "/api/game", { headers: { cookie } });
  assert.deepEqual((await recovered.json()).game, peek);
  const drawn = await act({ action: "draw" });
  assert.equal(drawn.draw?.current, peek.draw?.preview);
  assert.equal(drawn.draw?.preview, null);
  const scored = await act({ action: "stop" });
  assert.ok(scored.feedback && scored.feedback.points > 0);
  assert.equal((await readPlayer()).bestScore, null);
  await act({ action: "continue" });

  await finishWithWrongAnswers(1);
  assert.equal(game.screen, "results");
  assert.equal(game.totalPoints, scored.totalPoints);
  assert.equal((await readPlayer()).bestScore, scored.totalPoints);
  const previousVersion = game.version;
  const replay = await act({ action: "replay" });
  assert.equal(replay.screen, "board");
  assert.equal(replay.totalPoints, 0);
  assert.ok(replay.questions.every(q => q.points === null));
  assert.deepEqual(replay.spells, { fiftyFifty: 2, defuse: 1, peek: 3, double: 1 });
  assert.equal(replay.version, previousVersion + 1);
  assert.equal((await post({ action: "select", questionId: "01", expectedVersion: previousVersion })).status, 409);
  await finishWithWrongAnswers(0);
  assert.equal(game.totalPoints, 0);
  assert.equal((await readPlayer()).bestScore, scored.totalPoints);

  await startSession(names[2]);
  await finishWithWrongAnswers(0);
  assert.equal((await readPlayer()).bestScore, 0);
  const rows: Ranking["rows"] = [];
  for (let page = 1; page <= 20; page++) {
    const response = await fetch(url + "/api/game?rank=" + page, { headers: { cookie } });
    assert.equal(response.status, 200);
    const { ranking }: { ranking: Ranking } = await response.json();
    assert.ok(ranking.rows.length <= 5);
    rows.push(...ranking.rows);
    if (!ranking.hasMore) break;
  }
  const best = rows.find(row => row.name === names[1]);
  const zero = rows.find(row => row.name === names[2]);
  assert.ok(best && zero && best.rank < zero.rank);
  assert.equal(best.score, scored.totalPoints);
  assert.ok(Number.isFinite(Date.parse(best.completedAt)));
  assert.equal(rows.filter(row => row.name === names[1]).length, 1);
  assert.equal(zero.score, 0);
});

test("a Vietnam-time cutoff keeps the best eligible score even after a later record", async () => {
  await startSession(names[3]);
  const database = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await database.connect();
    const { rows: [history] } = await database.query(
      `SELECT count(*)::integer AS total FROM quiz_results JOIN game_sessions USING (session_key_hash)
       WHERE player_key = $1`, [names[1].toLowerCase()],
    );
    assert.equal(history.total, 2);
    await database.query(
      `INSERT INTO quiz_results (session_key_hash, version, score, completed_at)
       SELECT player.session_key_hash, record.version, record.score, record.completed_at
       FROM game_sessions AS player CROSS JOIN (VALUES
         (100, 20008, '2026-11-07T07:59:59.500Z'::timestamptz),
         (101, 20010, '2026-11-07T08:00:00.750Z'::timestamptz),
         (102, 20016, '2026-11-07T08:00:01.000Z'::timestamptz)
       ) AS record(version, score, completed_at) WHERE player.player_key = $1`, [names[3].toLowerCase()],
    );
  } finally {
    await database.end();
  }
  for (const [through, score, time] of [
    ["", 20016, "2026-11-07T08:00:01.000Z"],
    ["2026-11-07T15:00", 20010, "2026-11-07T08:00:00.750Z"],
    ["2026-11-07T14:59:59", 20008, "2026-11-07T07:59:59.500Z"],
  ] as const) {
    const query = new URLSearchParams({ rank: "1" });
    if (through) query.set("through", through);
    const response = await fetch(url + "/api/game?" + query, { headers: { cookie } });
    assert.equal(response.status, 200);
    const { ranking }: { ranking: Ranking } = await response.json();
    const row = ranking.rows.find(item => item.name === names[3]);
    assert.equal(row?.score, score);
    assert.equal(row?.completedAt, time);
  }
  const invalid = await fetch(url + "/api/game?rank=1&through=2026-02-30T15:00", { headers: { cookie } });
  assert.equal(invalid.status, 400);
});

test("repeated wrong PIN guesses are rate limited even when submitted concurrently", async () => {
  cookie = "";
  const guesses = await Promise.all(Array.from({ length: 22 }, () => post({ action: "join", name: names[0], pin: "000000" })));
  assert.ok(guesses.some(response => response.status === 429));
  assert.ok(guesses.every(response => response.status === 401 || response.status === 429));
  assert.ok(guesses.filter(response => response.status === 401).length <= 20);
  assert.equal((await post({ action: "join", name: names[0], pin })).status, 429);
});

test("the migration corrects a saved 8-point double without altering other rounds or repeating the change", async () => {
  const database = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await database.connect();
    await database.query("CREATE TEMP TABLE game_sessions (LIKE public.game_sessions INCLUDING ALL)");
    const rounds = Object.fromEntries(questions.map(({ id }) => [id, { score: id === "02" ? 2 : 0 }]));
    const state = { screen: "results", rounds: { ...rounds, "01": { outcome: "doubled", points: 8, score: 8 } } };
    await database.query("INSERT INTO game_sessions (session_key_hash, state, player_name, best_score) VALUES ($1, $2, $3, $4)",
      ["qa-legacy-double", state, "Người thử", 10]);
    const sql = await readFile(new URL("../db/003_correct_doubled_scores.sql", import.meta.url), "utf8");
    await database.query(sql);
    await database.query(sql);
    const { rows: [result] } = await database.query("SELECT state, version, best_score FROM game_sessions");
    assert.equal(result.state.rounds["01"].score, 16);
    assert.equal(result.state.rounds["02"].score, 2);
    assert.equal(result.version, 2);
    assert.equal(result.best_score, 18);
  } finally {
    await database.end();
  }
});
