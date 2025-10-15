import type { RequestHandler } from 'express';
import { z } from 'zod';

import { HttpError } from '../middleware/errorHandler';
import { getParticipantById } from '../services/participantService';
import { listSubmissionsByRound, saveDraft, submit } from '../services/submissionService';
import type { User } from '../services/userService';
import { asyncHandler } from '../utils/asyncHandler';

const submissionPayload = z.object({
  participantId: z.string().uuid(),
  audioId: z.string().uuid(),
  lyrics: z.string().min(1)
});

type SubmissionPayload = z.infer<typeof submissionPayload>;

export const saveDraftHandler: RequestHandler = asyncHandler(async (req, res) => {
  const payload: SubmissionPayload = submissionPayload.parse(req.body);
  await assertCanEditSubmission(req.user, payload.participantId);
  const submission = await saveDraft({
    roundId: req.params.roundId,
    ...payload
  });
  res.json({ submission });
});

export const submitHandler: RequestHandler = asyncHandler(async (req, res) => {
  const payload: SubmissionPayload = submissionPayload.parse(req.body);
  await assertCanEditSubmission(req.user, payload.participantId);
  const submission = await submit({
    roundId: req.params.roundId,
    ...payload
  });
  res.json({ submission });
});

export const listHandler: RequestHandler = asyncHandler(async (req, res) => {
  const submissions = await listSubmissionsByRound(req.params.roundId);
  res.json({ submissions });
});

async function assertCanEditSubmission(user: User | undefined, participantId: string): Promise<void> {
  if (!user) {
    throw new HttpError(401, 'Authentication required');
  }
  if (user.roles.includes('admin') || user.roles.includes('moderator')) {
    return;
  }
  const participant = await getParticipantById(participantId);
  if (!participant) {
    throw new HttpError(404, 'Participant not found');
  }
  if (participant.userId !== user.id) {
    throw new HttpError(403, 'You cannot modify another participant submission');
  }
}
