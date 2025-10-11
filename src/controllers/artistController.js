const { z } = require('zod');

const { asyncHandler } = require('../utils/asyncHandler');
const { getArtistProfile, upsertArtistProfile } = require('../services/artistProfileService');
const { HttpError } = require('../middleware/errorHandler');

const profileSchema = z.object({
  avatarKey: z.string().min(1).optional(),
  bio: z.string().max(2000).optional(),
  socials: z.record(z.string().url()).optional()
});

const getProfile = asyncHandler(async (req, res) => {
  await ensureAccess(req.user, req.params.userId);
  const profile = await getArtistProfile(req.params.userId);
  res.json({ profile });
});

const upsertProfile = asyncHandler(async (req, res) => {
  await ensureAccess(req.user, req.params.userId);
  const payload = profileSchema.parse(req.body);
  const profile = await upsertArtistProfile(req.params.userId, payload);
  res.json({ profile });
});

async function ensureAccess(user, targetUserId) {
  if (!user) {
    throw new HttpError(401, 'Authentication required');
  }
  if (user.id === targetUserId) return;
  if (user.roles.includes('admin') || user.roles.includes('moderator')) return;
  throw new HttpError(403, 'Not allowed to manage this profile');
}

module.exports = {
  getProfile,
  upsertProfile
};
