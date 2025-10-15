import type { RequestHandler } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../utils/asyncHandler';
import { authenticateUser, registerUser } from '../services/authService';
import { issueToken } from '../services/tokenService';
import { USER_ROLE_VALUES } from '../services/userService';

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

export const addRolesSchema = z.object({
  roles: z.array(z.enum(USER_ROLE_VALUES)).min(1)
});

type RegisterBody = z.infer<typeof registerSchema>;
type LoginBody = z.infer<typeof loginSchema>;

export const register: RequestHandler = asyncHandler(async (req, res) => {
  const payload: RegisterBody = registerSchema.parse(req.body);
  const user = await registerUser(payload);
  const token = issueToken(user);
  res.status(201).json({ user, token });
});

export const login: RequestHandler = asyncHandler(async (req, res) => {
  const payload: LoginBody = loginSchema.parse(req.body);
  const user = await authenticateUser(payload);
  const token = issueToken(user);
  res.json({ user, token });
});
