const { z } = require('zod');

const { asyncHandler } = require('../utils/asyncHandler');
const { getUserById, addRoles, setRoles } = require('../services/userService');
const { HttpError } = require('../middleware/errorHandler');

const rolesArraySchema = z
  .object({
    roles: z.array(z.enum(['admin', 'moderator', 'judge', 'artist', 'listener'])).min(1)
  });

const getMe = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required');
  }
  const user = await getUserById(req.user.id);
  res.json({ user });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.userId);
  if (!user) {
    throw new HttpError(404, 'User not found');
  }
  res.json({ user });
});

const addUserRoles = asyncHandler(async (req, res) => {
  const payload = rolesArraySchema.parse(req.body);
  const user = await addRoles(req.params.userId, payload.roles);
  res.json({ user });
});

const replaceUserRoles = asyncHandler(async (req, res) => {
  const payload = rolesArraySchema.parse(req.body);
  const user = await setRoles(req.params.userId, payload.roles);
  res.json({ user });
});

module.exports = {
  getMe,
  getUser,
  addUserRoles,
  replaceUserRoles
};
