const { z } = require('zod');

const { asyncHandler } = require('../utils/asyncHandler');
const { saveDraft, submit, listSubmissionsByRound } = require('../services/submissionService');
const { getParticipantById } = require('../services/participantService');
const { HttpError } = require('../middleware/errorHandler');

const submissionPayload = z.object({
  participantId: z.string().uuid(),
  audioId: z.string().uuid(),
  lyrics: z.string().min(1)
});

const saveDraftHandler = asyncHandler(async (req, res) => {
  const payload = submissionPayload.parse(req.body);
  await assertCanEditSubmission(req.user, payload.participantId);
  const submission = await saveDraft({
    roundId: req.params.roundId,
    ...payload
  });
  res.json({ submission });
});

const submitHandler = asyncHandler(async (req, res) => {
  const payload = submissionPayload.parse(req.body);
  await assertCanEditSubmission(req.user, payload.participantId);
  const submission = await submit({
    roundId: req.params.roundId,
    ...payload
  });
  res.json({ submission });
});

const listHandler = asyncHandler(async (req, res) => {
  const submissions = await listSubmissionsByRound(req.params.roundId);
  res.json({ submissions });
});

async function assertCanEditSubmission(user, participantId) {
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

module.exports = {
  saveDraftHandler,
  submitHandler,
  listHandler
};
