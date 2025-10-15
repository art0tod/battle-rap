import type { RequestHandler } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../middleware/errorHandler';
import { USER_ROLE_VALUES, addRoles, getUserById, setRoles } from '../services/userService';

const rolesArraySchema = z.object({
  roles: z.array(z.enum(USER_ROLE_VALUES)).min(1)
});

type RolesPayload = z.infer<typeof rolesArraySchema>;

export const getMe: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required');
  }
  const user = await getUserById(req.user.id);
  res.json({ user });
});

export const getUser: RequestHandler = asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.userId);
  if (!user) {
    throw new HttpError(404, 'User not found');
  }
  res.json({ user });
});

export const addUserRoles: RequestHandler = asyncHandler(async (req, res) => {
  const payload: RolesPayload = rolesArraySchema.parse(req.body);
  const user = await addRoles(req.params.userId, payload.roles);
  res.json({ user });
});

export const replaceUserRoles: RequestHandler = asyncHandler(async (req, res) => {
  const payload: RolesPayload = rolesArraySchema.parse(req.body);
  const user = await setRoles(req.params.userId, payload.roles);
  res.json({ user });
});
