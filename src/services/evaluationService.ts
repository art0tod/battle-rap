import { getPool } from '../db';
import { HttpError } from '../middleware/errorHandler';
import type { ScoringMode } from './roundService';
import { listCriteriaByRound } from './roundRubricService';

export interface Evaluation {
  id: string;
  judgeId: string;
  targetType: 'submission' | 'match';
  targetId: string;
  roundId: string;
  pass: boolean | null;
  score: number | null;
  rubric: Record<string, number> | null;
  totalScore: number | null;
  comment: string | null;
  createdAt: Date;
}

interface SubmissionRow {
  id: string;
  round_id: string;
  scoring: ScoringMode;
}

interface MatchRow {
  id: string;
  round_id: string;
  scoring: ScoringMode;
}

interface EvaluationRow {
  id: string;
  judge_id: string;
  target_type: 'submission' | 'match';
  target_id: string;
  round_id: string;
  pass: boolean | null;
  score: number | null;
  rubric: Record<string, number> | null;
  total_score: number | null;
  comment: string | null;
  created_at: Date;
}

interface EvaluateSubmissionParams {
  judgeId: string;
  submissionId: string;
  pass?: boolean | null;
  score?: number | null;
  comment?: string | null;
}

export async function evaluateSubmission({
  judgeId,
  submissionId,
  pass,
  score,
  comment
}: EvaluateSubmissionParams): Promise<Evaluation> {
  const pool = getPool();
  const submissionResult = await pool.query<SubmissionRow>(
    `SELECT s.id, s.round_id, r.scoring
     FROM submission s
     JOIN round r ON r.id = s.round_id
     WHERE s.id = $1`,
    [submissionId]
  );
  const submission = submissionResult.rows[0];
  if (!submission) {
    throw new HttpError(404, 'Submission not found');
  }

  if (submission.scoring === 'pass_fail') {
    if (typeof pass !== 'boolean') {
      throw new HttpError(400, 'pass flag is required for pass/fail rounds');
    }
  } else if (submission.scoring === 'points') {
    if (typeof score !== 'number') {
      throw new HttpError(400, 'score is required for points rounds');
    }
    if (score < 0 || score > 5) {
      throw new HttpError(400, 'score must be between 0 and 5');
    }
  } else {
    throw new HttpError(400, 'Submissions can only be evaluated in qualifier rounds');
  }

  const result = await pool.query<EvaluationRow>(
    `
      INSERT INTO evaluation (
        judge_id, target_type, target_id, round_id, pass, score, comment
      )
      VALUES ($1, 'submission', $2, $3, $4, $5, $6)
      ON CONFLICT (judge_id, target_type, target_id)
      DO UPDATE SET pass = EXCLUDED.pass,
                    score = EXCLUDED.score,
                    comment = EXCLUDED.comment,
                    created_at = now()
      RETURNING *
    `,
    [judgeId, submissionId, submission.round_id, pass ?? null, score ?? null, comment ?? null]
  );
  return formatEvaluation(result.rows[0]);
}

interface EvaluateMatchParams {
  judgeId: string;
  matchId: string;
  rubric: Record<string, number | string>;
  comment?: string | null;
}

export async function evaluateMatch({
  judgeId,
  matchId,
  rubric,
  comment
}: EvaluateMatchParams): Promise<Evaluation> {
  const pool = getPool();
  const matchResult = await pool.query<MatchRow>(
    `SELECT m.id, r.id AS round_id, r.scoring
     FROM match m
     JOIN round r ON r.id = m.round_id
     WHERE m.id = $1`,
    [matchId]
  );
  const match = matchResult.rows[0];
  if (!match) {
    throw new HttpError(404, 'Match not found');
  }
  if (match.scoring !== 'rubric') {
    throw new HttpError(400, 'Only rubric rounds can be evaluated for matches');
  }
  if (!rubric || typeof rubric !== 'object') {
    throw new HttpError(400, 'rubric object is required');
  }

  const criteria = await listCriteriaByRound(match.round_id);
  if (criteria.length === 0) {
    throw new HttpError(400, 'Rubric configuration missing for round');
  }

  const normalizedRubric: Record<string, number> = {};
  let totalScore = 0;
  const payloadKeys = new Set(Object.keys(rubric));

  for (const criterion of criteria) {
    const rawValue = (rubric as Record<string, unknown>)[criterion.key];
    if (rawValue === undefined) {
      throw new HttpError(422, `Rubric value for ${criterion.key} is required`);
    }
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      throw new HttpError(422, `Rubric value for ${criterion.key} must be a number`);
    }
    if (value < criterion.minValue || value > criterion.maxValue) {
      throw new HttpError(
        422,
        `Rubric value for ${criterion.key} must be between ${criterion.minValue} and ${criterion.maxValue}`
      );
    }
    normalizedRubric[criterion.key] = value;
    totalScore += value;
    payloadKeys.delete(criterion.key);
  }

  if (payloadKeys.size > 0) {
    throw new HttpError(400, `Unknown rubric keys: ${Array.from(payloadKeys).join(', ')}`);
  }

  const result = await pool.query<EvaluationRow>(
    `
      INSERT INTO evaluation (
        judge_id, target_type, target_id, round_id, rubric, total_score, comment
      )
      VALUES ($1, 'match', $2, $3, $4::jsonb, $5, $6)
      ON CONFLICT (judge_id, target_type, target_id)
      DO UPDATE SET rubric = EXCLUDED.rubric,
                    total_score = EXCLUDED.total_score,
                    comment = EXCLUDED.comment,
                    created_at = now()
      RETURNING *
    `,
    [
      judgeId,
      matchId,
      match.round_id,
      JSON.stringify(normalizedRubric),
      totalScore,
      comment ?? null
    ]
  );
  return formatEvaluation(result.rows[0]);
}

export async function listEvaluationsForSubmission(submissionId: string): Promise<Evaluation[]> {
  const pool = getPool();
  const result = await pool.query<EvaluationRow>(
    `SELECT * FROM evaluation
     WHERE target_type = 'submission' AND target_id = $1`,
    [submissionId]
  );
  return result.rows.map(formatEvaluation);
}

export async function listEvaluationsForMatch(matchId: string): Promise<Evaluation[]> {
  const pool = getPool();
  const result = await pool.query<EvaluationRow>(
    `SELECT * FROM evaluation
     WHERE target_type = 'match' AND target_id = $1`,
    [matchId]
  );
  return result.rows.map(formatEvaluation);
}

function formatEvaluation(row: EvaluationRow): Evaluation {
  return {
    id: row.id,
    judgeId: row.judge_id,
    targetType: row.target_type,
    targetId: row.target_id,
    roundId: row.round_id,
    pass: row.pass,
    score: row.score,
    rubric: row.rubric,
    totalScore: row.total_score,
    comment: row.comment,
    createdAt: row.created_at
  };
}
