const { transaction, getPool } = require('../db');
const { HttpError } = require('../middleware/errorHandler');

function mapMatch(row) {
  if (!row) return null;
  return {
    id: row.id,
    roundId: row.round_id,
    startsAt: row.starts_at
  };
}

function mapMatchTrack(row) {
  if (!row) return null;
  return {
    id: row.id,
    matchId: row.match_id,
    participantId: row.participant_id,
    audioId: row.audio_id,
    lyrics: row.lyrics,
    submittedAt: row.submitted_at
  };
}

async function createMatch({ roundId, startsAt }) {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO match (round_id, starts_at)
     VALUES ($1, $2)
     RETURNING id, round_id, starts_at`,
    [roundId, startsAt ?? null]
  );
  return mapMatch(result.rows[0]);
}

async function addMatchParticipant({ matchId, participantId, seed }) {
  try {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO match_participant (match_id, participant_id, seed)
       VALUES ($1, $2, $3)
       RETURNING match_id, participant_id, seed`,
      [matchId, participantId, seed ?? null]
    );
    return {
      matchId: result.rows[0].match_id,
      participantId: result.rows[0].participant_id,
      seed: result.rows[0].seed
    };
  } catch (error) {
    if (error.code === '23505') {
      throw new HttpError(409, 'Participant already assigned to match or duplicate seed');
    }
    throw error;
  }
}

async function listMatchParticipants(matchId) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT mp.match_id, mp.participant_id, mp.seed, u.display_name
     FROM match_participant mp
     JOIN tournament_participant tp ON tp.id = mp.participant_id
     JOIN app_user u ON u.id = tp.user_id
     WHERE mp.match_id = $1
     ORDER BY mp.seed NULLS LAST, u.display_name`,
    [matchId]
  );
  return result.rows.map((row) => ({
    matchId: row.match_id,
    participantId: row.participant_id,
    seed: row.seed,
    displayName: row.display_name
  }));
}

async function listMatchesByRound(roundId) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, round_id, starts_at
     FROM match
     WHERE round_id = $1
     ORDER BY starts_at`,
    [roundId]
  );
  return result.rows.map(mapMatch);
}

async function createMatchTrack({ matchId, participantId, audioId, lyrics }) {
  return transaction(async (client) => {
    const result = await client.query(
      `INSERT INTO match_track (match_id, participant_id, audio_id, lyrics)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [matchId, participantId, audioId, lyrics ?? null]
    );
    return mapMatchTrack(result.rows[0]);
  });
}

async function listMatchTracks(matchId) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT *
     FROM match_track
     WHERE match_id = $1`,
    [matchId]
  );
  return result.rows.map(mapMatchTrack);
}

module.exports = {
  createMatch,
  addMatchParticipant,
  listMatchParticipants,
  listMatchesByRound,
  createMatchTrack,
  listMatchTracks
};
