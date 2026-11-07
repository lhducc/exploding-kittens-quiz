import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";
import type { Ranking } from "../game-view.ts";
import type { GameState } from "./game.ts";

export type SavedGame = { version: number; state: GameState; name: string | null; bestScore: number | null };
const fields = 'version, state, player_name AS name, best_score AS "bestScore"';
let pool: Pool | undefined;

function database() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error("Cần đặt DATABASE_URL.");
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3, connectionTimeoutMillis: 7000 });
    if (process.env.VERCEL === "1") attachDatabasePool(pool);
    pool.on("error", () => console.error("Mất kết nối PostgreSQL trong pool."));
  }
  return pool;
}

export const newSession = () => randomBytes(32).toString("base64url");
const sessionHash = (token: string) => createHash("sha256").update(token).digest("hex");

export async function readGame(token: string) {
  const { rows } = await database().query<SavedGame>(
    "SELECT " + fields + " FROM game_sessions WHERE session_key_hash = $1", [sessionHash(token)],
  );
  return rows[0] ?? null;
}

export async function joinGame(token: string, name: string, key: string, state: GameState, bestScore: number | null) {
  const { rows } = await database().query<SavedGame>(
    `INSERT INTO game_sessions (session_key_hash, state, player_name, player_key, best_score)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (session_key_hash) DO UPDATE SET player_name = EXCLUDED.player_name,
       player_key = EXCLUDED.player_key, best_score = EXCLUDED.best_score, best_at = EXCLUDED.best_at,
       version = game_sessions.version + 1, updated_at = now()
     WHERE game_sessions.player_key IS NULL
     RETURNING ` + fields,
    [sessionHash(token), state, name, key, bestScore],
  );
  return rows[0] ?? null;
}

export async function saveGame(token: string, version: number, state: GameState, score: number | null) {
  const { rows } = await database().query<SavedGame>(
    `WITH saved AS (
       UPDATE game_sessions SET state = $3, version = version + 1, updated_at = now(),
         best_score = GREATEST(best_score, $4::integer),
         best_at = CASE WHEN $4::integer IS NOT NULL AND (best_score IS NULL OR $4::integer > best_score)
           THEN now() ELSE best_at END
       WHERE session_key_hash = $1 AND version = $2 RETURNING session_key_hash, updated_at, ${fields}
     ), finished AS (
       INSERT INTO quiz_results (session_key_hash, version, score, completed_at)
       SELECT session_key_hash, version, $4::integer, updated_at FROM saved WHERE $4::integer IS NOT NULL
     )
     SELECT version, state, name, "bestScore" FROM saved`,
    [sessionHash(token), version, state, score],
  );
  return rows[0] ?? null;
}

export async function allowPinAttempt(addressHash: string, failed: boolean) {
  const { rowCount } = await database().query(
    `INSERT INTO quiz_pin_attempts (address_hash, failures) VALUES ($1, $2)
     ON CONFLICT (address_hash) DO UPDATE SET
       window_start = CASE WHEN quiz_pin_attempts.window_start <= now() - interval '1 minute'
         THEN now() ELSE quiz_pin_attempts.window_start END,
       failures = CASE WHEN quiz_pin_attempts.window_start <= now() - interval '1 minute'
         THEN EXCLUDED.failures ELSE quiz_pin_attempts.failures + EXCLUDED.failures END
     WHERE quiz_pin_attempts.window_start <= now() - interval '1 minute' OR quiz_pin_attempts.failures < 20`,
    [addressHash, failed ? 1 : 0],
  );
  return rowCount === 1;
}

export async function readRanking(page: number, cutoff: Date | null): Promise<Ranking> {
  const size = 5;
  const offset = (page - 1) * size;
  const { rows } = await database().query<{ name: string; score: number; completedAt: Date }>(
    `WITH best AS (
       SELECT DISTINCT ON (session_key_hash) session_key_hash, score, completed_at
       FROM quiz_results
       WHERE $3::timestamptz IS NULL OR completed_at < $3::timestamptz + interval '1 second'
       ORDER BY session_key_hash, score DESC, completed_at
     )
     SELECT player.player_name AS name, best.score, best.completed_at AS "completedAt"
     FROM best JOIN game_sessions AS player USING (session_key_hash)
     ORDER BY best.score DESC, best.completed_at, player.player_key LIMIT $1 OFFSET $2`,
    [size + 1, offset, cutoff],
  );
  return { page, hasMore: rows.length > size, rows: rows.slice(0, size).map((row, index) => ({
    ...row, completedAt: row.completedAt.toISOString(), rank: offset + index + 1,
  })) };
}
