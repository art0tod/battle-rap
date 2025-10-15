import type { RequestHandler } from 'express';
import { z } from 'zod';

import { HttpError } from '../middleware/errorHandler';
import {
  evaluateMatch,
  evaluateSubmission,
  listEvaluationsForMatch,
  listEvaluationsForSubmission
} from '../services/evaluationService';
import { asyncHandler } from '../utils/asyncHandler';

const submissionEvalSchema = z.object({
  pass: z.boolean().optional(),
  score: z.number().int().optional(),
  comment: z.string().max(2000).optional()
});

const matchEvalSchema = z.object({
  rubric: z.record(z.number()),
  comment: z.string().max(2000).optional()
});

type SubmissionEvalPayload = z.infer<typeof submissionEvalSchema>;
type MatchEvalPayload = z.infer<typeof matchEvalSchema>;

export const evaluateSubmissionHandler: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required');
  }
  const payload: SubmissionEvalPayload = submissionEvalSchema.parse(req.body);
  const evaluation = await evaluateSubmission({
    judgeId: req.user.id,
    submissionId: req.params.submissionId,
    ...payload
  });
  res.status(201).json({ evaluation });
});

export const evaluateMatchHandler: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required');
  }
  const payload: MatchEvalPayload = matchEvalSchema.parse(req.body);
  const evaluation = await evaluateMatch({
    judgeId: req.user.id,
    matchId: req.params.matchId,
    ...payload
  });
  res.status(201).json({ evaluation });
});

export const listSubmissionEvaluationsHandler: RequestHandler = asyncHandler(async (req, res) => {
  const evaluations = await listEvaluationsForSubmission(req.params.submissionId);
  res.json({ evaluations });
});

export const listMatchEvaluationsHandler: RequestHandler = asyncHandler(async (req, res) => {
  const evaluations = await listEvaluationsForMatch(req.params.matchId);
  res.json({ evaluations });
});
