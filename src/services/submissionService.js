const { transaction, getPool } = require('../db');
const { HttpError } = require('../middleware/errorHandler');

function mapSubmission(row) {
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

async function saveDraft({ roundId, participantId, audioId, lyrics }) {
  return transaction(async (client) => {
    const existing = await client.query(
      `SELECT id, status, locked_by_admin
       FROM submission
       WHERE round_id = $1 AND participant_id = $2
       FOR UPDATE`,
      [roundId, participantId]
    );

    if (existing.rows[0]) {
      const current = existing.rows[0];
      if (current.locked_by_admin || current.status !== 'draft') {
        throw new HttpError(409, 'Submission is locked and cannot be edited');
      }
      const updateResult = await client.query(
        `UPDATE submission
         SET audio_id = $1,
             lyrics = $2,
             updated_at = now()
         WHERE id = $3
         RETURNING *`,
        [audioId, lyrics, current.id]
      );
      return mapSubmission(updateResult.rows[0]);
    }

    const insertResult = await client.query(
      `INSERT INTO submission (round_id, participant_id, audio_id, lyrics)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [roundId, participantId, audioId, lyrics]
    );
    return mapSubmission(insertResult.rows[0]);
  });
}

async function submit({ roundId, participantId, audioId, lyrics }) {
  return transaction(async (client) => {
    const existing = await client.query(
      `SELECT id, status, locked_by_admin
       FROM submission
       WHERE round_id = $1 AND participant_id = $2
       FOR UPDATE`,
      [roundId, participantId]
    );
    if (!existing.rows[0]) {
      const insertResult = await client.query(
        `INSERT INTO submission (round_id, participant_id, audio_id, lyrics, status, submitted_at)
         VALUES ($1, $2, $3, $4, 'submitted', now())
         RETURNING *`,
        [roundId, participantId, audioId, lyrics]
      );
      return mapSubmission(insertResult.rows[0]);
    }
    const current = existing.rows[0];
    if (current.locked_by_admin) {
      throw new HttpError(409, 'Submission is locked by admin');
    }
    if (current.status !== 'draft') {
      throw new HttpError(409, 'Submission already submitted');
    }
    const updateResult = await client.query(
      `UPDATE submission
       SET audio_id = $1,
           lyrics = $2,
           status = 'submitted',
           submitted_at = now(),
           updated_at = now()
       WHERE id = $3
       RETURNING *`,
      [audioId, lyrics, current.id]
    );
    return mapSubmission(updateResult.rows[0]);
  });
}

async function getSubmissionById(id) {
  const pool = getPool();
  const result = await pool.query('SELECT * FROM submission WHERE id = $1', [id]);
  return mapSubmission(result.rows[0]);
}

async function listSubmissionsByRound(roundId) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT *
     FROM submission
     WHERE round_id = $1`,
    [roundId]
  );
  return result.rows.map(mapSubmission);
}

async function setSubmissionLock({ submissionId, locked, status }) {
  const allowedStatuses = ['draft', 'submitted', 'locked', 'disqualified'];
  if (status && !allowedStatuses.includes(status)) {
    throw new HttpError(400, `Unsupported submission status: ${status}`);
  }
  if (locked && status === 'draft') {
    throw new HttpError(400, 'Locked submissions cannot be in draft status');
  }

  return transaction(async (client) => {
    const result = await client.query(
      `UPDATE submission
       SET locked_by_admin = $2,
           status = COALESCE($3, status),
           updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [submissionId, locked, status ?? null]
    );
    const submission = result.rows[0];
    if (!submission) {
      throw new HttpError(404, 'Submission not found');
    }
    return mapSubmission(submission);
  });
}

module.exports = {
  saveDraft,
  submit,
  getSubmissionById,
  listSubmissionsByRound,
  setSubmissionLock
};
