import type { RequestHandler } from 'express';
import { z } from 'zod';

import { HttpError } from '../middleware/errorHandler';
import { asyncHandler } from '../utils/asyncHandler';
import {
  addJudge,
  addParticipant,
  createTournament,
  listTournamentJudges,
  listTournamentParticipants,
  listTournaments,
  setTournamentStatus
} from '../services/tournamentService';
import { ensureTournamentVisible } from './helpers/visibility';
import { isStaff } from '../utils/access';

const createTournamentSchema = z.object({
  title: z.string().min(3),
  maxBracketSize: z.union([z.literal(128), z.literal(256)])
});

const statusSchema = z.object({
  status: z.enum(['draft', 'active', 'finished'] as const)
});

const linkUserSchema = z.object({
  userId: z.string().uuid()
});

type CreateTournamentPayload = z.infer<typeof createTournamentSchema>;
type StatusPayload = z.infer<typeof statusSchema>;
type LinkUserPayload = z.infer<typeof linkUserSchema>;

export const list: RequestHandler = asyncHandler(async (req, res) => {
  const includeDrafts = isStaff(req.user);
  const tournaments = await listTournaments({ includeDrafts });
  res.json({ tournaments });
});

export const create: RequestHandler = asyncHandler(async (req, res) => {
  const payload: CreateTournamentPayload = createTournamentSchema.parse(req.body);
  const tournament = await createTournament(payload);
  res.status(201).json({ tournament });
});

export const show: RequestHandler = asyncHandler(async (req, res) => {
  const includePrivate = isStaff(req.user);
  const tournament = await ensureTournamentVisible(req.params.tournamentId, req.user);
  if (!includePrivate && tournament.status === 'draft') {
    throw new HttpError(404, 'Tournament not found');
  }

  if (!includePrivate) {
    const [participants, judges] = await Promise.all([
      listTournamentParticipants(tournament.id),
      listTournamentJudges(tournament.id)
    ]);
    res.json({
      tournament,
      participants: participants.map((participant) => ({
        id: participant.id,
        userId: participant.userId,
        displayName: participant.displayName
      })),
      judges: judges.map((judge) => ({
        userId: judge.userId,
        displayName: judge.displayName
      }))
    });
    return;
  }

  const [participants, judges] = await Promise.all([
    listTournamentParticipants(tournament.id),
    listTournamentJudges(tournament.id)
  ]);
  res.json({ tournament, participants, judges });
});

export const updateStatus: RequestHandler = asyncHandler(async (req, res) => {
  const payload: StatusPayload = statusSchema.parse(req.body);
  const tournament = await setTournamentStatus(req.params.tournamentId, payload.status);
  res.json({ tournament });
});

export const registerParticipant: RequestHandler = asyncHandler(async (req, res) => {
  const payload: LinkUserPayload = linkUserSchema.parse(req.body);
  const participant = await addParticipant({
    tournamentId: req.params.tournamentId,
    userId: payload.userId
  });
  res.status(201).json({ participant });
});

export const assignJudge: RequestHandler = asyncHandler(async (req, res) => {
  const payload: LinkUserPayload = linkUserSchema.parse(req.body);
  const judge = await addJudge({
    tournamentId: req.params.tournamentId,
    userId: payload.userId
  });
  res.status(201).json({ judge });
});

export const listParticipantsHandler: RequestHandler = asyncHandler(async (req, res) => {
  const participants = await listTournamentParticipants(req.params.tournamentId);
  res.json({ participants });
});

export const listJudgesHandler: RequestHandler = asyncHandler(async (req, res) => {
  const judges = await listTournamentJudges(req.params.tournamentId);
  res.json({ judges });
});
