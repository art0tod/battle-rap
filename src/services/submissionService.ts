import { getPool, transaction } from '../db';
import { HttpError } from '../middleware/errorHandler';

export type SubmissionStatus = 'draft' | 'submitted' | 'locked' | 'disqualified';

export interface Submission {
  id: string;
  roundId: string;
  participantId: string;
  audioId: string | null;
  lyrics: string | null;
  status: SubmissionStatus;
  submittedAt: Date | null;
  lockedByAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SubmissionRow {
  id: string;
  round_id: string;
  participant_id: string;
  audio_id: string | null;
  lyrics: string | null;
  status: SubmissionStatus;
  submitted_at: Date | null;
  locked_by_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

function mapSubmission(row?: SubmissionRow | null): Submission | null {
  if (!row) return null;
  return {
    id: row.id,
    roundId: row.round_id,
    participantId: row.participant_id,
    audioId: row.audio_id,
    lyrics: row.lyrics,
    status: row.status,
    submittedAt: row.submitted_at,
    lockedByAdmin: row.locked_by_admin,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

interface DraftInput {
  roundId: string;
  participantId: string;
  audioId?: string | null;
  lyrics?: string | null;
}

export async function saveDraft({
  roundId,
  participantId,
  audioId,
  lyrics
}: DraftInput): Promise<Submission | null> {
  return transaction(async (client) => {
    const existing = await client.query<{
      id: string;
      status: SubmissionStatus;
      locked_by_admin: boolean;
    }>(
      `SELECT id, status, locked_by_admin
       FROM submission
       WHERE round_id = $1 AND participant_id = $2
       FOR UPDATE`,
      [roundId, participantId]
    );

    const current = existing.rows[0];
    if (current) {
      if (current.locked_by_admin || current.status !== 'draft') {
        throw new HttpError(409, 'Submission is locked and cannot be edited');
      }
      const updateResult = await client.query<SubmissionRow>(
        `UPDATE submission
         SET audio_id = $1,
             lyrics = $2,
             updated_at = now()
         WHERE id = $3
         RETURNING *`,
        [audioId ?? null, lyrics ?? null, current.id]
      );
      return mapSubmission(updateResult.rows[0]);
    }

    const insertResult = await client.query<SubmissionRow>(
      `INSERT INTO submission (round_id, participant_id, audio_id, lyrics)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [roundId, participantId, audioId ?? null, lyrics ?? null]
    );
    return mapSubmission(insertResult.rows[0]);
  });
}

export async function submit({
  roundId,
  participantId,
  audioId,
  lyrics
}: DraftInput): Promise<Submission | null> {
  return transaction(async (client) => {
    const existing = await client.query<{
      id: string;
      status: SubmissionStatus;
      locked_by_admin: boolean;
    }>(
      `SELECT id, status, locked_by_admin
       FROM submission
       WHERE round_id = $1 AND participant_id = $2
       FOR UPDATE`,
      [roundId, participantId]
    );
    const current = existing.rows[0];
    if (!current) {
      const insertResult = await client.query<SubmissionRow>(
        `INSERT INTO submission (round_id, participant_id, audio_id, lyrics, status, submitted_at)
         VALUES ($1, $2, $3, $4, 'submitted', now())
         RETURNING *`,
        [roundId, participantId, audioId ?? null, lyrics ?? null]
      );
      return mapSubmission(insertResult.rows[0]);
    }
    if (current.locked_by_admin) {
      throw new HttpError(409, 'Submission is locked by admin');
    }
    if (current.status !== 'draft') {
      throw new HttpError(409, 'Submission already submitted');
    }
    const updateResult = await client.query<SubmissionRow>(
      `UPDATE submission
       SET audio_id = $1,
           lyrics = $2,
           status = 'submitted',
           submitted_at = now(),
           updated_at = now()
       WHERE id = $3
       RETURNING *`,
      [audioId ?? null, lyrics ?? null, current.id]
    );
    return mapSubmission(updateResult.rows[0]);
  });
}

export async function getSubmissionById(id: string): Promise<Submission | null> {
  const pool = getPool();
  const result = await pool.query<SubmissionRow>('SELECT * FROM submission WHERE id = $1', [id]);
  return mapSubmission(result.rows[0]);
}

export async function listSubmissionsByRound(roundId: string): Promise<Submission[]> {
  const pool = getPool();
  const result = await pool.query<SubmissionRow>(
    `SELECT *
     FROM submission
     WHERE round_id = $1`,
    [roundId]
  );
  return result.rows
    .map((row) => mapSubmission(row))
    .filter((submission): submission is Submission => submission !== null);
}

export interface SetSubmissionLockParams {
  submissionId: string;
  locked: boolean;
  status?: SubmissionStatus;
}

const ALLOWED_STATUSES: SubmissionStatus[] = ['draft', 'submitted', 'locked', 'disqualified'];

export async function setSubmissionLock({
  submissionId,
  locked,
  status
}: SetSubmissionLockParams): Promise<Submission> {
  if (status && !ALLOWED_STATUSES.includes(status)) {
    throw new HttpError(400, `Unsupported submission status: ${status}`);
  }
  if (locked && status === 'draft') {
    throw new HttpError(400, 'Locked submissions cannot be in draft status');
  }

  return transaction(async (client) => {
    const result = await client.query<SubmissionRow>(
      `UPDATE submission
       SET locked_by_admin = $2,
           status = COALESCE($3, status),
           updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [submissionId, locked, status ?? null]
    );
    const submission = mapSubmission(result.rows[0]);
    if (!submission) {
      throw new HttpError(404, 'Submission not found');
    }
    return submission;
  });
}
