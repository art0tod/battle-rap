const jwt = require('jsonwebtoken');

const { loadConfig } = require('../config/env');

function issueToken(user) {
  const config = loadConfig();
  const payload = {
    sub: user.id,
    email: user.email,
    roles: user.roles
  };
  return jwt.sign(payload, config.security.jwtSecret, {
    expiresIn: config.security.jwtExpiresIn
  });
}

function verifyToken(token) {
  const config = loadConfig();
  return jwt.verify(token, config.security.jwtSecret);
}

module.exports = {
  issueToken,
  verifyToken
};
