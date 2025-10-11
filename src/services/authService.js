const bcrypt = require('bcryptjs');

const { loadConfig } = require('../config/env');
const { HttpError } = require('../middleware/errorHandler');
const { createUser, getUserByEmail } = require('./userService');

async function registerUser({ email, password, displayName, roles }) {
  const config = loadConfig();
  const saltRounds = config.hashing.saltRounds;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  return createUser({ email, passwordHash, displayName, roles });
}

async function authenticateUser({ email, password }) {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new HttpError(401, 'Invalid credentials');
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new HttpError(401, 'Invalid credentials');
  }
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

module.exports = {
  registerUser,
  authenticateUser
};
