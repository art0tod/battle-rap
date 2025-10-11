const { z } = require('zod');

const { asyncHandler } = require('../utils/asyncHandler');
const {
  createMatch,
  listMatchesByRound,
  addMatchParticipant,
  listMatchParticipants,
  createMatchTrack,
  listMatchTracks
} = require('../services/matchService');

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

const create = asyncHandler(async (req, res) => {
  const payload = createMatchSchema.parse(req.body);
  const match = await createMatch({
    roundId: req.params.roundId,
    ...payload
  });
  res.status(201).json({ match });
});

const list = asyncHandler(async (req, res) => {
  const matches = await listMatchesByRound(req.params.roundId);
  res.json({ matches });
});

const addParticipantHandler = asyncHandler(async (req, res) => {
  const payload = participantSchema.parse(req.body);
  const entry = await addMatchParticipant({
    matchId: req.params.matchId,
    ...payload
  });
  res.status(201).json({ participant: entry });
});

const listParticipantsHandler = asyncHandler(async (req, res) => {
  const participants = await listMatchParticipants(req.params.matchId);
  res.json({ participants });
});

const addTrackHandler = asyncHandler(async (req, res) => {
  const payload = trackSchema.parse(req.body);
  const track = await createMatchTrack({
    matchId: req.params.matchId,
    ...payload
  });
  res.status(201).json({ track });
});

const listTracksHandler = asyncHandler(async (req, res) => {
  const tracks = await listMatchTracks(req.params.matchId);
  res.json({ tracks });
});

module.exports = {
  create,
  list,
  addParticipantHandler,
  listParticipantsHandler,
  addTrackHandler,
  listTracksHandler
};
