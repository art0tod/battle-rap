const { z } = require('zod');

const { asyncHandler } = require('../utils/asyncHandler');
const {
  getDashboardStats,
  adminListUsers,
  adminSetSubmissionLock,
  adminCreateMediaAsset,
  adminListMediaAssets
} = require('../services/adminService');
const { MEDIA_KINDS } = require('../services/mediaService');

const submissionModerationSchema = z.object({
  locked: z.boolean(),
  status: z
    .enum(['submitted', 'locked', 'disqualified', 'draft'])
    .optional()
});

const mediaAssetSchema = z
  .object({
    kind: z.enum(MEDIA_KINDS),
    storageKey: z.string().min(1),
    mime: z.string().min(1),
    sizeBytes: z.number().int().positive(),
    durationSec: z.number().min(0).optional()
  })
  .refine(
    (value) => value.kind !== 'audio' || typeof value.durationSec === 'number',
    { message: 'Audio assets require durationSec', path: ['durationSec'] }
  );

const mediaQuerySchema = z
  .object({
    kind: z.enum(MEDIA_KINDS).optional()
  })
  .optional();

const dashboard = asyncHandler(async (req, res) => {
  const stats = await getDashboardStats();
  res.json({ stats });
});

const listUsers = asyncHandler(async (req, res) => {
  const users = await adminListUsers();
  res.json({ users });
});

const moderateSubmission = asyncHandler(async (req, res) => {
  const payload = submissionModerationSchema.parse(req.body);
  const submission = await adminSetSubmissionLock({
    submissionId: req.params.submissionId,
    locked: payload.locked,
    status: payload.status
  });
  res.json({ submission });
});

const createMediaAsset = asyncHandler(async (req, res) => {
  const payload = mediaAssetSchema.parse(req.body);
  const media = await adminCreateMediaAsset(payload);
  res.status(201).json({ media });
});

const listMediaAssetsHandler = asyncHandler(async (req, res) => {
  const query = mediaQuerySchema.parse(req.query);
  const mediaAssets = await adminListMediaAssets(query || {});
  res.json({ mediaAssets });
});

module.exports = {
  dashboard,
  listUsers,
  moderateSubmission,
  createMediaAsset,
  listMediaAssetsHandler
};
