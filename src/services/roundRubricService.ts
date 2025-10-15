import type { PoolClient } from 'pg';

import { getPool } from '../db';

export interface RoundRubricCriterion {
  id: string;
  roundId: string;
  key: string;
  name: string;
  weight: number;
  minValue: number;
  maxValue: number;
}

interface RoundRubricCriterionRow {
  id: string;
  round_id: string;
  key: string;
  name: string;
  weight: string;
  min_value: string;
  max_value: string;
}

export async function listCriteriaByRound(roundId: string): Promise<RoundRubricCriterion[]> {
  const pool = getPool();
  const result = await pool.query<RoundRubricCriterionRow>(
    `SELECT id, round_id, key, name, weight, min_value, max_value
       FROM round_rubric_criterion
      WHERE round_id = $1
      ORDER BY key`,
    [roundId]
  );
  return result.rows.map(mapCriterion);
}

export async function ensureDefaultCriteriaForKeys(
  client: PoolClient,
  roundId: string,
  keys: readonly string[]
): Promise<void> {
  if (keys.length === 0) return;
  await client.query(
    `
      INSERT INTO round_rubric_criterion (round_id, key, name, weight, min_value, max_value)
      SELECT $1, key, name, 1.0, 0, 100
      FROM UNNEST($2::text[], $3::text[]) AS t(key, name)
      ON CONFLICT (round_id, key) DO NOTHING
    `,
    [
      roundId,
      keys.map((key) => normalizeKey(key)),
      keys.map((key) => generateNameFromKey(key))
    ]
  );
}

function mapCriterion(row: RoundRubricCriterionRow): RoundRubricCriterion {
  return {
    id: row.id,
    roundId: row.round_id,
    key: row.key,
    name: row.name,
    weight: Number(row.weight),
    minValue: Number(row.min_value),
    maxValue: Number(row.max_value)
  };
}

function normalizeKey(key: string): string {
  return key.trim().toLowerCase();
}

function generateNameFromKey(key: string): string {
  const normalized = normalizeKey(key);
  return normalized
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
