WITH corrections AS (
  SELECT session.session_key_hash, fixed.rounds, fixed.completed_score
  FROM game_sessions AS session
  CROSS JOIN LATERAL (
    SELECT jsonb_object_agg(original.key, patched.round) AS rounds,
      CASE WHEN count(*) = count(patched.round ->> 'score')
        THEN sum((patched.round ->> 'score')::integer)::integer END AS completed_score
    FROM jsonb_each(session.state -> 'rounds') AS original
    CROSS JOIN LATERAL (
      SELECT CASE WHEN original.value ->> 'outcome' = 'doubled'
        THEN jsonb_set(original.value, '{score}', to_jsonb(2 * (original.value ->> 'points')::integer))
        ELSE original.value END AS round
    ) AS patched
    HAVING bool_or(original.value <> patched.round)
  ) AS fixed
)
UPDATE game_sessions AS session
SET state = jsonb_set(session.state, '{rounds}', corrections.rounds),
  version = session.version + 1,
  updated_at = now(),
  best_score = CASE WHEN session.player_name IS NOT NULL
    THEN GREATEST(session.best_score, corrections.completed_score) ELSE session.best_score END,
  best_at = CASE WHEN session.player_name IS NOT NULL AND corrections.completed_score IS NOT NULL
      AND (session.best_score IS NULL OR corrections.completed_score > session.best_score)
    THEN now() ELSE session.best_at END
FROM corrections
WHERE session.session_key_hash = corrections.session_key_hash;
