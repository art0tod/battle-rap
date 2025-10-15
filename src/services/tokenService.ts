import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';

import { HttpError } from '../middleware/errorHandler';
import { loadConfig } from '../config/env';
import type { User } from './userService';

export interface TokenPayload extends JwtPayload {
  sub: string;
  email: string;
  roles: User['roles'];
}

export function issueToken(user: Pick<User, 'id' | 'email' | 'roles'>): string {
  const config = loadConfig();
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    roles: user.roles
  };
  const options: SignOptions = {
    expiresIn: config.security.jwtExpiresIn as SignOptions['expiresIn']
  };
  return jwt.sign(payload, config.security.jwtSecret, options);
}

export function verifyToken(token: string): TokenPayload {
  const config = loadConfig();
  const decoded = jwt.verify(token, config.security.jwtSecret);
  if (typeof decoded === 'string') {
    throw new HttpError(401, 'Invalid token payload');
  }
  return decoded as TokenPayload;
}
