import type { RequestHandler } from 'express';
import { z } from 'zod';

import {
  addMatchParticipant,
  createMatch,
  createMatchTrack,
  listMatchParticipants,
  listMatchTracks,
  listMatchesByRound
} from '../services/matchService';
import { asyncHandler } from '../utils/asyncHandler';

const createMatchSchema = z.object({
  startsAt: z.string().datetime().optional()
});

const participantSchema = z.object({
  participantId: z.string().uuid(),
  seed: z.number().int().positive().optional()
});

const trackSchema = z.object({
  participantId: z.string().uuid(),
  audioId: z.string().uuid(),
  lyrics: z.string().min(1).optional()
});

type CreateMatchPayload = z.infer<typeof createMatchSchema>;
type MatchParticipantPayload = z.infer<typeof participantSchema>;
type MatchTrackPayload = z.infer<typeof trackSchema>;

export const create: RequestHandler = asyncHandler(async (req, res) => {
  const payload: CreateMatchPayload = createMatchSchema.parse(req.body);
  const match = await createMatch({
    roundId: req.params.roundId,
    ...payload
  });
  res.status(201).json({ match });
});

export const list: RequestHandler = asyncHandler(async (req, res) => {
  const matches = await listMatchesByRound(req.params.roundId);
  res.json({ matches });
});

export const addParticipantHandler: RequestHandler = asyncHandler(async (req, res) => {
  const payload: MatchParticipantPayload = participantSchema.parse(req.body);
  const entry = await addMatchParticipant({
    matchId: req.params.matchId,
    ...payload
  });
  res.status(201).json({ participant: entry });
});

export const listParticipantsHandler: RequestHandler = asyncHandler(async (req, res) => {
  const participants = await listMatchParticipants(req.params.matchId);
  res.json({ participants });
});

export const addTrackHandler: RequestHandler = asyncHandler(async (req, res) => {
  const payload: MatchTrackPayload = trackSchema.parse(req.body);
  const track = await createMatchTrack({
    matchId: req.params.matchId,
    ...payload
  });
  res.status(201).json({ track });
});

export const listTracksHandler: RequestHandler = asyncHandler(async (req, res) => {
  const tracks = await listMatchTracks(req.params.matchId);
  res.json({ tracks });
});
