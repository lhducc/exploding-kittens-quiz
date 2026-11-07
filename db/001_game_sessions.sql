CREATE TABLE IF NOT EXISTS game_sessions (
  session_key_hash text PRIMARY KEY,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  state jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
