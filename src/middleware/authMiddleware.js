const { HttpError } = require('./errorHandler');
const { verifyToken } = require('../services/tokenService');
const { getUserById } = require('../services/userService');

async function authenticate(req, res, next) {
  try {
    const user = await resolveUserFromRequest(req);
    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    next(error);
  }
}

function requireAuth(req, res, next) {
  resolveUserFromRequest(req)
    .then((user) => {
      if (!user) {
        throw new HttpError(401, 'Authentication required');
      }
      req.user = user;
      next();
    })
    .catch(next);
}

function requireRoles(roles) {
  return (req, res, next) => {
    requireAuth(req, res, (err) => {
      if (err) return next(err);
      if (!hasAnyRole(req.user, roles)) {
        return next(new HttpError(403, 'Insufficient privileges'));
      }
      next();
    });
  };
}

function allowSelfOrRoles(roles) {
  return (req, res, next) => {
    requireAuth(req, res, (err) => {
      if (err) return next(err);
      const targetId = req.params.userId;
      if (req.user.id === targetId || hasAnyRole(req.user, roles)) {
        return next();
      }
      next(new HttpError(403, 'Insufficient privileges'));
    });
  };
}

function allowRolesOrSelfBody(roles, field) {
  return (req, res, next) => {
    requireAuth(req, res, (err) => {
      if (err) return next(err);
      const targetId = req.body?.[field];
      if (!targetId) {
        return next(new HttpError(400, `Missing ${field}`));
      }
      if (req.user.id === targetId || hasAnyRole(req.user, roles)) {
        return next();
      }
      next(new HttpError(403, 'Insufficient privileges'));
    });
  };
}

function hasAnyRole(user, roles) {
  if (!Array.isArray(roles) || roles.length === 0) return true;
  return roles.some((role) => user.roles.includes(role));
}

async function resolveUserFromRequest(req) {
  if (req.user) return req.user;
  const header = req.headers.authorization;
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return null;
  }
  const token = header.slice(7).trim();
  if (!token) {
    throw new HttpError(401, 'Authentication token missing');
  }
  let payload;
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

module.exports = {
  authenticate,
  requireAuth,
  requireRoles,
  allowSelfOrRoles,
  allowRolesOrSelfBody
};
