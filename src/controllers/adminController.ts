import type { RequestHandler } from 'express';
import { z } from 'zod';

import {
  adminCreateMediaAsset,
  adminListMediaAssets,
  adminListUsers,
  adminSetSubmissionLock,
  getDashboardStats
} from '../services/adminService';
import { MEDIA_KINDS, type ListMediaAssetsParams } from '../services/mediaService';
import { asyncHandler } from '../utils/asyncHandler';

const submissionModerationSchema = z.object({
  locked: z.boolean(),
  status: z.enum(['submitted', 'locked', 'disqualified', 'draft'] as const).optional()
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

type SubmissionModerationPayload = z.infer<typeof submissionModerationSchema>;
type MediaAssetPayload = z.infer<typeof mediaAssetSchema>;

export const dashboard: RequestHandler = asyncHandler(async (req, res) => {
  const stats = await getDashboardStats();
  res.json({ stats });
});

export const listUsers: RequestHandler = asyncHandler(async (req, res) => {
  const users = await adminListUsers();
  res.json({ users });
});

export const moderateSubmission: RequestHandler = asyncHandler(async (req, res) => {
  const payload: SubmissionModerationPayload = submissionModerationSchema.parse(req.body);
  const submission = await adminSetSubmissionLock({
    submissionId: req.params.submissionId,
    locked: payload.locked,
    status: payload.status
  });
  res.json({ submission });
});

export const createMediaAsset: RequestHandler = asyncHandler(async (req, res) => {
  const payload: MediaAssetPayload = mediaAssetSchema.parse(req.body);
  const media = await adminCreateMediaAsset(payload);
  res.status(201).json({ media });
});

export const listMediaAssetsHandler: RequestHandler = asyncHandler(async (req, res) => {
  const query = mediaQuerySchema.parse(req.query) ?? {};
  const mediaAssets = await adminListMediaAssets(query as ListMediaAssetsParams);
  res.json({ mediaAssets });
});
