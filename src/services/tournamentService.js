const { transaction, getPool } = require('../db');
const { HttpError } = require('../middleware/errorHandler');

function mapTournament(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    maxBracketSize: row.max_bracket_size,
    status: row.status,
    createdAt: row.created_at
  };
}

async function listTournaments() {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, title, max_bracket_size, status, created_at
     FROM tournament
     ORDER BY created_at DESC`
  );
  return result.rows.map(mapTournament);
}

async function getTournamentById(id) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, title, max_bracket_size, status, created_at
     FROM tournament WHERE id = $1`,
    [id]
  );
  return mapTournament(result.rows[0]);
}

async function createTournament({ title, maxBracketSize }) {
  if (![128, 256].includes(maxBracketSize)) {
    throw new HttpError(400, 'maxBracketSize must be 128 or 256');
  }
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO tournament (title, max_bracket_size)
     VALUES ($1, $2)
     RETURNING id, title, max_bracket_size, status, created_at`,
    [title, maxBracketSize]
  );
  return mapTournament(result.rows[0]);
}

async function setTournamentStatus(id, status) {
  const allowed = ['draft', 'active', 'finished'];
  if (!allowed.includes(status)) {
    throw new HttpError(400, `Unsupported status: ${status}`);
  }
  const pool = getPool();
  const result = await pool.query(
    `UPDATE tournament SET status = $2 WHERE id = $1
     RETURNING id, title, max_bracket_size, status, created_at`,
    [id, status]
  );
  const tournament = mapTournament(result.rows[0]);
  if (!tournament) {
    throw new HttpError(404, 'Tournament not found');
  }
  return tournament;
}

async function addParticipant({ tournamentId, userId }) {
  return transaction(async (client) => {
    const tournament = await client.query(
      'SELECT id FROM tournament WHERE id = $1',
      [tournamentId]
    );
    if (!tournament.rows[0]) {
      throw new HttpError(404, 'Tournament not found');
    }
    const result = await client.query(
      `INSERT INTO tournament_participant (tournament_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (tournament_id, user_id) DO NOTHING
       RETURNING id, tournament_id, user_id`,
      [tournamentId, userId]
    );
    const participant = result.rows[0];
    if (!participant) {
      throw new HttpError(409, 'User already registered for tournament');
    }
    return participant;
  });
}

async function addJudge({ tournamentId, userId }) {
  try {
    const pooled = await transaction(async (client) => {
      const tournament = await client.query(
        'SELECT id FROM tournament WHERE id = $1',
        [tournamentId]
      );
      if (!tournament.rows[0]) {
        throw new HttpError(404, 'Tournament not found');
      }
      const result = await client.query(
        `INSERT INTO tournament_judge (tournament_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING
         RETURNING tournament_id, user_id`,
        [tournamentId, userId]
      );
      const judge = result.rows[0];
      if (!judge) {
        throw new HttpError(409, 'Judge already assigned');
      }
      return judge;
    });
    return pooled;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw error;
  }
}

async function listTournamentParticipants(tournamentId) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT tp.id, tp.user_id, u.display_name, u.email
     FROM tournament_participant tp
     JOIN app_user u ON u.id = tp.user_id
     WHERE tp.tournament_id = $1
     ORDER BY u.display_name`,
    [tournamentId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    email: row.email
  }));
}

async function listTournamentJudges(tournamentId) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT tj.user_id, u.display_name, u.email
     FROM tournament_judge tj
     JOIN app_user u ON u.id = tj.user_id
     WHERE tj.tournament_id = $1
     ORDER BY u.display_name`,
    [tournamentId]
  );
  return result.rows.map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    email: row.email
  }));
}

module.exports = {
  listTournaments,
  getTournamentById,
  createTournament,
  setTournamentStatus,
  addParticipant,
  addJudge,
  listTournamentParticipants,
  listTournamentJudges
};
