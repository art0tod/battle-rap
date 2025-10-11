const { getPool } = require('../db');

function mapProfile(row) {
  if (!row) return null;
  return {
    userId: row.user_id,
    avatarKey: row.avatar_key,
    bio: row.bio,
    socials: row.socials || {}
  };
}

async function getArtistProfile(userId) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT user_id, avatar_key, bio, socials
     FROM artist_profile
     WHERE user_id = $1`,
    [userId]
  );
  return mapProfile(result.rows[0]);
}

async function upsertArtistProfile(userId, payload) {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO artist_profile (user_id, avatar_key, bio, socials)
     VALUES ($1, $2, $3, $4::jsonb)
     ON CONFLICT (user_id)
     DO UPDATE SET
       avatar_key = EXCLUDED.avatar_key,
       bio = EXCLUDED.bio,
       socials = EXCLUDED.socials
     RETURNING user_id, avatar_key, bio, socials`,
    [
      userId,
      payload.avatarKey ?? null,
      payload.bio ?? null,
      JSON.stringify(payload.socials ?? {})
    ]
  );
  return mapProfile(result.rows[0]);
}

module.exports = {
  getArtistProfile,
  upsertArtistProfile
};
