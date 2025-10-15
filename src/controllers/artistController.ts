import type { RequestHandler } from 'express';
import { z } from 'zod';

import { HttpError } from '../middleware/errorHandler';
import { getArtistProfile, upsertArtistProfile } from '../services/artistProfileService';
import type { User } from '../services/userService';
import { asyncHandler } from '../utils/asyncHandler';

const profileSchema = z.object({
  avatarKey: z.string().min(1).optional(),
  bio: z.string().max(2000).optional(),
  socials: z.record(z.string().url()).optional()
});

type ProfilePayload = z.infer<typeof profileSchema>;

export const getProfile: RequestHandler = asyncHandler(async (req, res) => {
  ensureAccess(req.user, req.params.userId);
  const profile = await getArtistProfile(req.params.userId);
  res.json({ profile });
});

export const upsertProfile: RequestHandler = asyncHandler(async (req, res) => {
  ensureAccess(req.user, req.params.userId);
  const payload: ProfilePayload = profileSchema.parse(req.body);
  const profile = await upsertArtistProfile(req.params.userId, payload);
  res.json({ profile });
});

function ensureAccess(user: User | undefined, targetUserId: string): void {
  if (!user) {
    throw new HttpError(401, 'Authentication required');
  }
  if (user.id === targetUserId) return;
  if (user.roles.includes('admin') || user.roles.includes('moderator')) return;
  throw new HttpError(403, 'Not allowed to manage this profile');
}
