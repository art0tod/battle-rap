const { getPool } = require('../db');
const { listUsers } = require('./userService');
const { setSubmissionLock } = require('./submissionService');
const { createMediaAsset, listMediaAssets } = require('./mediaService');

async function getDashboardStats() {
  const pool = getPool();
  const [users, tournaments, submissions, mediaAssets] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE array_length(roles.roles, 1) > 0)::int AS with_roles,
         COUNT(*) FILTER (WHERE roles.roles @> ARRAY['artist'])::int AS artists
       FROM (
         SELECT u.id, ARRAY_AGG(aur.role) FILTER (WHERE aur.role IS NOT NULL) AS roles
         FROM app_user u
         LEFT JOIN app_user_role aur ON aur.user_id = u.id
         GROUP BY u.id
       ) roles`
    ),
    pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'active')::int AS active,
         COUNT(*) FILTER (WHERE status = 'finished')::int AS finished
       FROM tournament`
    ),
    pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'submitted')::int AS submitted,
         COUNT(*) FILTER (WHERE status = 'locked')::int AS locked,
         COUNT(*) FILTER (WHERE status = 'disqualified')::int AS disqualified
       FROM submission`
    ),
    pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE kind = 'audio')::int AS audio,
         COUNT(*) FILTER (WHERE kind = 'image')::int AS image
       FROM media_asset`
    )
  ]);

  return {
    users: users.rows[0],
    tournaments: tournaments.rows[0],
    submissions: submissions.rows[0],
    mediaAssets: mediaAssets.rows[0]
  };
}

async function adminListUsers() {
  return listUsers();
}

async function adminSetSubmissionLock(params) {
  return setSubmissionLock(params);
}

async function adminCreateMediaAsset(payload) {
  return createMediaAsset(payload);
}

async function adminListMediaAssets(filter) {
  return listMediaAssets(filter);
}

module.exports = {
  getDashboardStats,
  adminListUsers,
  adminSetSubmissionLock,
  adminCreateMediaAsset,
  adminListMediaAssets
};
