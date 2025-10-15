import type { Request, RequestHandler } from 'express';

import { HttpError } from './errorHandler';
import { verifyToken } from '../services/tokenService';
import { getUserById, type User, type UserRole } from '../services/userService';

type MutableRequest = Request & { user?: User };

export const authenticate: RequestHandler = async (req, res, next) => {
  try {
    const user = await resolveUserFromRequest(req);
    if (user) {
      (req as MutableRequest).user = user;
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAuth: RequestHandler = (req, res, next) => {
  resolveUserFromRequest(req)
    .then((user) => {
      if (!user) {
        throw new HttpError(401, 'Authentication required');
      }
      (req as MutableRequest).user = user;
      next();
    })
    .catch(next);
};

export function requireRoles(roles: readonly UserRole[]): RequestHandler {
  return (req, res, next) => {
    requireAuth(req, res, (err?: unknown) => {
      if (err) return next(err);
      const user = (req as MutableRequest).user;
      if (!user) {
        return next(new HttpError(401, 'Authentication required'));
      }
      if (!hasAnyRole(user, roles)) {
        return next(new HttpError(403, 'Insufficient privileges'));
      }
      next();
    });
  };
}

export function allowSelfOrRoles(roles: readonly UserRole[]): RequestHandler {
  return (req, res, next) => {
    requireAuth(req, res, (err?: unknown) => {
      if (err) return next(err);
      const user = (req as MutableRequest).user;
      if (!user) {
        return next(new HttpError(401, 'Authentication required'));
      }
      const targetId = req.params.userId;
      if (user.id === targetId || hasAnyRole(user, roles)) {
        return next();
      }
      next(new HttpError(403, 'Insufficient privileges'));
    });
  };
}

export function allowRolesOrSelfBody(
  roles: readonly UserRole[],
  field: string
): RequestHandler {
  return (req, res, next) => {
    requireAuth(req, res, (err?: unknown) => {
      if (err) return next(err);
      const user = (req as MutableRequest).user;
      if (!user) {
        return next(new HttpError(401, 'Authentication required'));
      }
      const body = req.body as Record<string, unknown> | undefined;
      const targetId = body?.[field];
      if (typeof targetId !== 'string') {
        return next(new HttpError(400, `Missing ${field}`));
      }
      if (user.id === targetId || hasAnyRole(user, roles)) {
        return next();
      }
      next(new HttpError(403, 'Insufficient privileges'));
    });
  };
}

function hasAnyRole(user: User, roles: readonly UserRole[]): boolean {
  if (roles.length === 0) return true;
  return roles.some((role) => user.roles.includes(role));
}

async function resolveUserFromRequest(req: Request): Promise<User | null> {
  const existingUser = (req as MutableRequest).user;
  if (existingUser) return existingUser;
  const header = req.headers.authorization;
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return null;
  }
  const token = header.slice(7).trim();
  if (!token) {
    throw new HttpError(401, 'Authentication token missing');
  }
  let payload: ReturnType<typeof verifyToken>;
  try {
    payload = verifyToken(token);
  } catch (error) {
    throw new HttpError(401, 'Invalid token');
  }
  const user = await getUserById(payload.sub);
  if (!user) {
    throw new HttpError(401, 'User not found');
  }
  return user;
}
