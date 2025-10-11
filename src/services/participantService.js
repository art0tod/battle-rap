const { getPool } = require('../db');

async function getParticipantById(id) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, tournament_id, user_id
     FROM tournament_participant
     WHERE id = $1`,
    [id]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    userId: row.user_id
  };
}

module.exports = {
  getParticipantById
};
