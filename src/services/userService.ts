import type { PoolClient } from 'pg';

import { getPool, transaction } from '../db';
import { HttpError } from '../middleware/errorHandler';

export const USER_ROLE_VALUES = ['admin', 'moderator', 'judge', 'artist', 'listener'] as const;
export type UserRole = (typeof USER_ROLE_VALUES)[number];
const DEFAULT_ROLE: UserRole = 'listener';

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
  roles: UserRole[];
}

export interface UserWithPasswordHash extends User {
  passwordHash: string;
}

interface UserRow {
  id: string;
  email: string;
  display_name: string;
  created_at: Date;
  updated_at: Date;
  password_hash?: string;
}

interface UserRolesRow {
  role: UserRole;
}

interface ListUsersRow {
  id: string;
  email: string;
  display_name: string;
  created_at: Date;
  updated_at: Date;
  roles: UserRole[];
}

function mapUser(row?: UserRow | null): Omit<User, 'roles'> | null {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getUserByEmail(email: string): Promise<UserWithPasswordHash | null> {
  const pool = getPool();
  const result = await pool.query<UserRow>(
    `SELECT id, email, display_name, created_at, updated_at, password_hash
     FROM app_user WHERE email_norm = lower($1)`,
    [email]
  );
  const user = result.rows[0];
  if (!user || !user.password_hash) return null;
  const roles = await getUserRoles(user.id);
  const baseUser = mapUser(user);
  if (!baseUser) return null;
  return {
    ...baseUser,
    passwordHash: user.password_hash,
    roles
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const pool = getPool();
  const result = await pool.query<UserRow>(
    `SELECT id, email, display_name, created_at, updated_at
     FROM app_user WHERE id = $1`,
    [id]
  );
  const user = mapUser(result.rows[0]);
  if (!user) return null;
  const roles = await getUserRoles(id);
  return { ...user, roles };
}

export async function listUsers(): Promise<User[]> {
  const pool = getPool();
  const result = await pool.query<ListUsersRow>(
    `SELECT
       u.id,
       u.email,
       u.display_name,
       u.created_at,
       u.updated_at,
       COALESCE(
         ARRAY_AGG(aur.role ORDER BY aur.role) FILTER (WHERE aur.role IS NOT NULL),
         '{}'
       ) AS roles
     FROM app_user u
     LEFT JOIN app_user_role aur ON aur.user_id = u.id
     GROUP BY u.id
     ORDER BY u.created_at DESC`
  );
  return result.rows.map((row) => ({
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    roles: row.roles
  }));
}

export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const pool = getPool();
  const result = await pool.query<UserRolesRow>(
    `SELECT role FROM app_user_role WHERE user_id = $1 ORDER BY role`,
    [userId]
  );
  return result.rows.map((row) => row.role);
}

interface CreateUserParams {
  email: string;
  passwordHash: string;
  displayName: string;
  roles?: readonly string[];
}

export async function createUser({
  email,
  passwordHash,
  displayName,
  roles = []
}: CreateUserParams): Promise<User> {
  const normalizedRoles = normalizeRoles(roles);
  return transaction(async (client) => {
    await ensureEmailAvailable(client, email);
    const insertResult = await client.query<UserRow>(
      `INSERT INTO app_user (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, display_name, created_at, updated_at`,
      [email, passwordHash, displayName]
    );
    const user = insertResult.rows[0];
    if (!user) {
      throw new Error('Failed to insert user');
    }

    const rolesToInsert = normalizedRoles.length > 0 ? normalizedRoles : [DEFAULT_ROLE];

    await client.query(
      `
        INSERT INTO app_user_role (user_id, role)
        SELECT $1, role::user_role
        FROM unnest($2::text[]) AS role
        ON CONFLICT DO NOTHING
      `,
      [user.id, rolesToInsert]
    );

    const baseUser = mapUser(user);
    if (!baseUser) {
      throw new Error('Failed to map inserted user');
    }
    return { ...baseUser, roles: rolesToInsert };
  });
}

export async function addRoles(userId: string, roles: readonly string[]): Promise<User | null> {
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

export async function setRoles(userId: string, roles: readonly string[]): Promise<User | null> {
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

function normalizeRoles(inputRoles: unknown): UserRole[] {
  if (!Array.isArray(inputRoles)) return [];
  const unique = Array.from(
    new Set(
      inputRoles
        .filter((role): role is string => typeof role === 'string')
        .map((role) => role.trim())
    )
  );
  for (const role of unique) {
    if (!USER_ROLE_VALUES.includes(role as UserRole)) {
      throw new HttpError(400, `Unsupported role: ${role}`);
    }
  }
  return unique as UserRole[];
}

async function ensureEmailAvailable(client: PoolClient, email: string): Promise<void> {
  const existing = await client.query<{ id: string }>(
    'SELECT id FROM app_user WHERE email_norm = lower($1)',
    [email]
  );
  if (existing.rows[0]) {
    throw new HttpError(409, 'Email already registered');
  }
}
