const { z } = require('zod');

const { asyncHandler } = require('../utils/asyncHandler');
const {
  listTournaments,
  createTournament,
  getTournamentById,
  setTournamentStatus,
  addParticipant,
  addJudge,
  listTournamentParticipants,
  listTournamentJudges
} = require('../services/tournamentService');
const { HttpError } = require('../middleware/errorHandler');

const createTournamentSchema = z.object({
  title: z.string().min(3),
  maxBracketSize: z.union([z.literal(128), z.literal(256)])
});

const statusSchema = z.object({
  status: z.enum(['draft', 'active', 'finished'])
});

const linkUserSchema = z.object({
  userId: z.string().uuid()
});

const list = asyncHandler(async (req, res) => {
  const tournaments = await listTournaments();
  res.json({ tournaments });
});

const create = asyncHandler(async (req, res) => {
  const payload = createTournamentSchema.parse(req.body);
  const tournament = await createTournament(payload);
  res.status(201).json({ tournament });
});

const show = asyncHandler(async (req, res) => {
  const tournament = await getTournamentById(req.params.tournamentId);
  if (!tournament) {
    throw new HttpError(404, 'Tournament not found');
  }
  const [participants, judges] = await Promise.all([
    listTournamentParticipants(tournament.id),
    listTournamentJudges(tournament.id)
  ]);
  res.json({ tournament, participants, judges });
});

const updateStatus = asyncHandler(async (req, res) => {
  const payload = statusSchema.parse(req.body);
  const tournament = await setTournamentStatus(req.params.tournamentId, payload.status);
  res.json({ tournament });
});

const registerParticipant = asyncHandler(async (req, res) => {
  const payload = linkUserSchema.parse(req.body);
  const participant = await addParticipant({
    tournamentId: req.params.tournamentId,
    userId: payload.userId
  });
  res.status(201).json({ participant });
});

const assignJudge = asyncHandler(async (req, res) => {
  const payload = linkUserSchema.parse(req.body);
  const judge = await addJudge({
    tournamentId: req.params.tournamentId,
    userId: payload.userId
  });
  res.status(201).json({ judge });
});

const listParticipantsHandler = asyncHandler(async (req, res) => {
  const participants = await listTournamentParticipants(req.params.tournamentId);
  res.json({ participants });
});

const listJudgesHandler = asyncHandler(async (req, res) => {
  const judges = await listTournamentJudges(req.params.tournamentId);
  res.json({ judges });
});

module.exports = {
  list,
  create,
  show,
  updateStatus,
  registerParticipant,
  assignJudge,
  listParticipantsHandler,
  listJudgesHandler
};
