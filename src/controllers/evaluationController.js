const { z } = require('zod');

const { asyncHandler } = require('../utils/asyncHandler');
const {
  evaluateSubmission,
  evaluateMatch,
  listEvaluationsForSubmission,
  listEvaluationsForMatch
} = require('../services/evaluationService');

const submissionEvalSchema = z.object({
  pass: z.boolean().optional(),
  score: z.number().int().optional(),
  comment: z.string().max(2000).optional()
});

const matchEvalSchema = z.object({
  rubric: z.record(z.number().int()),
  comment: z.string().max(2000).optional()
});

const evaluateSubmissionHandler = asyncHandler(async (req, res) => {
  const payload = submissionEvalSchema.parse(req.body);
  const evaluation = await evaluateSubmission({
    judgeId: req.user.id,
    submissionId: req.params.submissionId,
    ...payload
  });
  res.status(201).json({ evaluation });
});

const evaluateMatchHandler = asyncHandler(async (req, res) => {
  const payload = matchEvalSchema.parse(req.body);
  const evaluation = await evaluateMatch({
    judgeId: req.user.id,
    matchId: req.params.matchId,
    ...payload
  });
  res.status(201).json({ evaluation });
});

const listSubmissionEvaluationsHandler = asyncHandler(async (req, res) => {
  const evaluations = await listEvaluationsForSubmission(req.params.submissionId);
  res.json({ evaluations });
});

const listMatchEvaluationsHandler = asyncHandler(async (req, res) => {
  const evaluations = await listEvaluationsForMatch(req.params.matchId);
  res.json({ evaluations });
});

module.exports = {
  evaluateSubmissionHandler,
  evaluateMatchHandler,
  listSubmissionEvaluationsHandler,
  listMatchEvaluationsHandler
};
