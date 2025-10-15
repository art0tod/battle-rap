import bcrypt from 'bcryptjs';

import { loadConfig } from '../config/env';
import { HttpError } from '../middleware/errorHandler';
import { createUser, getUserByEmail, type User, type UserWithPasswordHash } from './userService';

interface RegisterUserParams {
  email: string;
  password: string;
  displayName: string;
  roles?: readonly string[];
}

interface AuthenticateParams {
  email: string;
  password: string;
}

export async function registerUser({
  email,
  password,
  displayName,
  roles
}: RegisterUserParams): Promise<User> {
  const config = loadConfig();
  const saltRounds = config.hashing.saltRounds;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  const normalizedRoles = roles?.map((role) => role.toString()) ?? [];
  return createUser({ email, passwordHash, displayName, roles: normalizedRoles });
}

export async function authenticateUser({ email, password }: AuthenticateParams): Promise<User> {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new HttpError(401, 'Invalid credentials');
  }
  await assertPasswordValid(user, password);
  const { passwordHash: _passwordHash, ...safeUser } = user;
  void _passwordHash;
  return safeUser;
}

async function assertPasswordValid(user: UserWithPasswordHash, password: string): Promise<void> {
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new HttpError(401, 'Invalid credentials');
  }
}
