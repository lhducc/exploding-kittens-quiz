CREATE TABLE IF NOT EXISTS quiz_results (
  session_key_hash text NOT NULL REFERENCES game_sessions (session_key_hash) ON DELETE CASCADE,
  version integer NOT NULL,
  score integer NOT NULL CHECK (score >= 0),
  completed_at timestamptz NOT NULL,
  PRIMARY KEY (session_key_hash, version)
);

INSERT INTO quiz_results (session_key_hash, version, score, completed_at)
SELECT session_key_hash, 0, best_score, best_at
FROM game_sessions AS player
WHERE player_name IS NOT NULL AND best_score IS NOT NULL AND best_at IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM quiz_results WHERE session_key_hash = player.session_key_hash)
ON CONFLICT DO NOTHING;
