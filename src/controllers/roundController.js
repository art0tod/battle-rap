const { z } = require('zod');

const { asyncHandler } = require('../utils/asyncHandler');
const { createRound, listRoundsByTournament } = require('../services/roundService');

const createRoundSchema = z.object({
  kind: z.enum(['qualifier1', 'qualifier2', 'bracket']),
  number: z.number().int().positive(),
  scoring: z.enum(['pass_fail', 'points', 'rubric']),
  rubricKeys: z.array(z.string().min(1)).optional()
});

const create = asyncHandler(async (req, res) => {
  const payload = createRoundSchema.parse(req.body);
  const round = await createRound({
    tournamentId: req.params.tournamentId,
    ...payload
  });
  res.status(201).json({ round });
});

const list = asyncHandler(async (req, res) => {
  const rounds = await listRoundsByTournament(req.params.tournamentId);
  res.json({ rounds });
});

module.exports = {
  create,
  list
};
