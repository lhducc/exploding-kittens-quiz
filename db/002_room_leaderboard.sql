ALTER TABLE game_sessions
  ADD COLUMN IF NOT EXISTS player_name text,
  ADD COLUMN IF NOT EXISTS player_key text,
  ADD COLUMN IF NOT EXISTS best_score integer CHECK (best_score >= 0),
  ADD COLUMN IF NOT EXISTS best_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS game_sessions_player_key_unique ON game_sessions (player_key);
CREATE INDEX IF NOT EXISTS game_sessions_best_idx
  ON game_sessions (best_score DESC, best_at, player_key) WHERE best_score IS NOT NULL;

CREATE TABLE IF NOT EXISTS quiz_pin_attempts (
  address_hash text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  failures integer NOT NULL CHECK (failures >= 0)
);
