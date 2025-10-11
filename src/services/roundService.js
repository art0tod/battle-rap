const { getPool } = require('../db');
const { HttpError } = require('../middleware/errorHandler');

const ROUND_KINDS = ['qualifier1', 'qualifier2', 'bracket'];
const SCORING_MODES = ['pass_fail', 'points', 'rubric'];

function mapRound(row) {
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

async function createRound({ tournamentId, kind, number, scoring, rubricKeys }) {
  if (!ROUND_KINDS.includes(kind)) {
    throw new HttpError(400, `Unsupported round kind: ${kind}`);
  }
  if (!SCORING_MODES.includes(scoring)) {
    throw new HttpError(400, `Unsupported scoring mode: ${scoring}`);
  }
  if (scoring === 'rubric' && (!Array.isArray(rubricKeys) || rubricKeys.length === 0)) {
    throw new HttpError(400, 'Rubric rounds require rubricKeys');
  }
  if (scoring !== 'rubric') {
    rubricKeys = null;
  }

  const pool = getPool();
  let rubricParam = rubricKeys;
  if (Array.isArray(rubricKeys)) {
    rubricParam = rubricKeys.map((key) => key.toLowerCase());
  }
  try {
    const result = await pool.query(
      `INSERT INTO round (tournament_id, kind, number, scoring, rubric_keys)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, tournament_id, kind, number, scoring, rubric_keys, created_at`,
      [tournamentId, kind, number, scoring, rubricParam]
    );
    return mapRound(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      throw new HttpError(409, 'Round with the same kind and number already exists');
    }
    throw error;
  }
}

async function listRoundsByTournament(tournamentId) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, tournament_id, kind, number, scoring, rubric_keys, created_at
     FROM round
     WHERE tournament_id = $1
     ORDER BY number`,
    [tournamentId]
  );
  return result.rows.map(mapRound);
}

async function getRoundById(roundId) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, tournament_id, kind, number, scoring, rubric_keys, created_at
     FROM round
     WHERE id = $1`,
    [roundId]
  );
  return mapRound(result.rows[0]);
}

module.exports = {
  ROUND_KINDS,
  SCORING_MODES,
  createRound,
  listRoundsByTournament,
  getRoundById
};
