const { transaction, getPool } = require('../db');
const { HttpError } = require('../middleware/errorHandler');

const USER_ROLE_VALUES = ['admin', 'moderator', 'judge', 'artist', 'listener'];

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function getUserByEmail(email) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, email, display_name, created_at, updated_at, password_hash
     FROM app_user WHERE email_norm = lower($1)`,
    [email]
  );
  const user = result.rows[0];
  if (!user) return null;
  const roles = await getUserRoles(user.id);
  return { ...mapUser(user), passwordHash: user.password_hash, roles };
}

async function getUserById(id) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, email, display_name, created_at, updated_at
     FROM app_user WHERE id = $1`,
    [id]
  );
  const user = mapUser(result.rows[0]);
  if (!user) return null;
  const roles = await getUserRoles(id);
  return { ...user, roles };
}

async function getUserRoles(userId) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT role FROM app_user_role WHERE user_id = $1 ORDER BY role`,
    [userId]
  );
  return result.rows.map((row) => row.role);
}

async function createUser({ email, passwordHash, displayName, roles = [] }) {
  const normalizedRoles = normalizeRoles(roles);
  return transaction(async (client) => {
    const existing = await client.query(
      'SELECT id FROM app_user WHERE email_norm = lower($1)',
      [email]
    );
    if (existing.rows[0]) {
      throw new HttpError(409, 'Email already registered');
    }
    const insertResult = await client.query(
      `INSERT INTO app_user (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, display_name, created_at, updated_at`,
      [email, passwordHash, displayName]
    );
    const user = insertResult.rows[0];

    const rolesToInsert = normalizedRoles.length > 0 ? normalizedRoles : ['listener'];

    await client.query(
      `
        INSERT INTO app_user_role (user_id, role)
        SELECT $1, role::user_role
        FROM unnest($2::text[]) AS role
        ON CONFLICT DO NOTHING
      `,
      [user.id, rolesToInsert]
    );

    return { ...mapUser(user), roles: rolesToInsert };
  });
}

async function addRoles(userId, roles) {
  const normalizedRoles = normalizeRoles(roles);
  if (normalizedRoles.length === 0) {
    return getUserById(userId);
  }
  await transaction(async (client) => {
    await client.query(
      `
        INSERT INTO app_user_role (user_id, role)
        SELECT $1, role::user_role
        FROM unnest($2::text[]) AS role
        ON CONFLICT DO NOTHING
      `,
      [userId, normalizedRoles]
    );
    await client.query('UPDATE app_user SET updated_at = now() WHERE id = $1', [userId]);
  });
  return getUserById(userId);
}

async function setRoles(userId, roles) {
  const normalizedRoles = normalizeRoles(roles);
  await transaction(async (client) => {
    await client.query('DELETE FROM app_user_role WHERE user_id = $1', [userId]);
    if (normalizedRoles.length > 0) {
      await client.query(
        `
          INSERT INTO app_user_role (user_id, role)
          SELECT $1, role::user_role
          FROM unnest($2::text[]) AS role
        `,
        [userId, normalizedRoles]
      );
    }
    await client.query('UPDATE app_user SET updated_at = now() WHERE id = $1', [userId]);
  });
  return getUserById(userId);
}

function normalizeRoles(inputRoles) {
  if (!Array.isArray(inputRoles)) return [];
  const unique = Array.from(new Set(inputRoles.map((role) => role.trim())));
  for (const role of unique) {
    if (!USER_ROLE_VALUES.includes(role)) {
      throw new HttpError(400, `Unsupported role: ${role}`);
    }
  }
  return unique;
}

module.exports = {
  USER_ROLE_VALUES,
  createUser,
  getUserByEmail,
  getUserById,
  addRoles,
  setRoles,
  getUserRoles
};
