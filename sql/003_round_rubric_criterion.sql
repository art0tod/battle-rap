-- migrate:up
BEGIN;

CREATE TABLE round_rubric_criterion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES round(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  weight NUMERIC(5,2) NOT NULL CHECK (weight > 0),
  min_value NUMERIC(6,2) NOT NULL DEFAULT 0,
  max_value NUMERIC(6,2) NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_round_rubric_criterion_key UNIQUE (round_id, key),
  CONSTRAINT chk_round_rubric_bounds CHECK (max_value >= min_value)
);

CREATE INDEX idx_round_rubric_criterion_round
  ON round_rubric_criterion(round_id);

INSERT INTO round_rubric_criterion (round_id, key, name, weight, min_value, max_value)
SELECT
  r.id,
  lower(key) AS key,
  initcap(regexp_replace(key, '_', ' ', 'g')) AS name,
  1.0 AS weight,
  0 AS min_value,
  100 AS max_value
FROM round r
CROSS JOIN LATERAL unnest(COALESCE(r.rubric_keys, '{}')) AS t(key)
ON CONFLICT DO NOTHING;

COMMIT;

-- migrate:down
BEGIN;

DROP TABLE IF EXISTS round_rubric_criterion;

COMMIT;
