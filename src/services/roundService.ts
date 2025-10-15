import { getPool, transaction } from '../db';
import { HttpError } from '../middleware/errorHandler';
import { ensureDefaultCriteriaForKeys } from './roundRubricService';

export const ROUND_KINDS = ['qualifier1', 'qualifier2', 'bracket'] as const;
export type RoundKind = (typeof ROUND_KINDS)[number];

export const SCORING_MODES = ['pass_fail', 'points', 'rubric'] as const;
export type ScoringMode = (typeof SCORING_MODES)[number];

export interface Round {
  id: string;
  tournamentId: string;
  kind: RoundKind;
  number: number;
  scoring: ScoringMode;
  rubricKeys: string[] | null;
  createdAt: Date;
}

interface RoundRow {
  id: string;
  tournament_id: string;
  kind: RoundKind;
  number: number;
  scoring: ScoringMode;
  rubric_keys: string[] | null;
  created_at: Date;
}

function mapRound(row?: RoundRow | null): Round | null {
  if (!row) return null;
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    kind: row.kind,
    number: row.number,
    scoring: row.scoring,
    rubricKeys: row.rubric_keys,
    createdAt: row.created_at
  };
}

interface CreateRoundParams {
  tournamentId: string;
  kind: RoundKind;
  number: number;
  scoring: ScoringMode;
  rubricKeys?: string[] | null;
}

export async function createRound({
  tournamentId,
  kind,
  number,
  scoring,
  rubricKeys
}: CreateRoundParams): Promise<Round | null> {
  if (!ROUND_KINDS.includes(kind)) {
    throw new HttpError(400, `Unsupported round kind: ${kind}`);
  }
  if (!SCORING_MODES.includes(scoring)) {
    throw new HttpError(400, `Unsupported scoring mode: ${scoring}`);
  }
  if (scoring === 'rubric' && (!Array.isArray(rubricKeys) || rubricKeys.length === 0)) {
    throw new HttpError(400, 'Rubric rounds require rubricKeys');
  }

  const normalizedKeys =
    scoring === 'rubric' && Array.isArray(rubricKeys)
      ? rubricKeys.map((key) => key.toLowerCase())
      : null;

  try {
    return await transaction(async (client) => {
      const result = await client.query<RoundRow>(
        `INSERT INTO round (tournament_id, kind, number, scoring, rubric_keys)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, tournament_id, kind, number, scoring, rubric_keys, created_at`,
        [tournamentId, kind, number, scoring, normalizedKeys]
      );
      const round = mapRound(result.rows[0]);
      if (round && normalizedKeys) {
        await ensureDefaultCriteriaForKeys(client, round.id, normalizedKeys);
      }
      return round;
    });
  } catch (error: unknown) {
    if (isDatabaseConflictError(error)) {
      throw new HttpError(409, 'Round with the same kind and number already exists');
    }
    throw error;
  }
}

export async function listRoundsByTournament(tournamentId: string): Promise<Round[]> {
  const pool = getPool();
  const result = await pool.query<RoundRow>(
    `SELECT id, tournament_id, kind, number, scoring, rubric_keys, created_at
     FROM round
     WHERE tournament_id = $1
     ORDER BY number`,
    [tournamentId]
  );
  return result.rows
    .map((row) => mapRound(row))
    .filter((round): round is Round => round !== null);
}

export async function getRoundById(roundId: string): Promise<Round | null> {
  const pool = getPool();
  const result = await pool.query<RoundRow>(
    `SELECT id, tournament_id, kind, number, scoring, rubric_keys, created_at
     FROM round
     WHERE id = $1`,
    [roundId]
  );
  return mapRound(result.rows[0]);
}

function isDatabaseConflictError(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === '23505'
  );
}
