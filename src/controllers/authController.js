const { z } = require('zod');

const { asyncHandler } = require('../utils/asyncHandler');
const { registerUser, authenticateUser } = require('../services/authService');
const { issueToken } = require('../services/tokenService');
const { USER_ROLE_VALUES } = require('../services/userService');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2),
  roles: z.array(z.enum(USER_ROLE_VALUES)).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const addRolesSchema = z.object({
  roles: z
    .array(z.enum(USER_ROLE_VALUES))
    .min(1)
});

const register = asyncHandler(async (req, res) => {
  const payload = registerSchema.parse(req.body);
  const user = await registerUser(payload);
  const token = issueToken(user);
  res.status(201).json({ user, token });
});

const login = asyncHandler(async (req, res) => {
  const payload = loginSchema.parse(req.body);
  const user = await authenticateUser(payload);
  const token = issueToken(user);
  res.json({ user, token });
});

module.exports = {
  register,
  login,
  addRolesSchema
};
