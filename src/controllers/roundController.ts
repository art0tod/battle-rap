import type { RequestHandler } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../utils/asyncHandler';
import { createRound, listRoundsByTournament } from '../services/roundService';

const createRoundSchema = z.object({
  kind: z.enum(['qualifier1', 'qualifier2', 'bracket'] as const),
  number: z.number().int().positive(),
  scoring: z.enum(['pass_fail', 'points', 'rubric'] as const),
  rubricKeys: z.array(z.string().min(1)).optional()
});

type CreateRoundPayload = z.infer<typeof createRoundSchema>;

export const create: RequestHandler = asyncHandler(async (req, res) => {
  const payload: CreateRoundPayload = createRoundSchema.parse(req.body);
  const round = await createRound({
    tournamentId: req.params.tournamentId,
    ...payload
  });
  res.status(201).json({ round });
});

export const list: RequestHandler = asyncHandler(async (req, res) => {
  const rounds = await listRoundsByTournament(req.params.tournamentId);
  res.json({ rounds });
});
