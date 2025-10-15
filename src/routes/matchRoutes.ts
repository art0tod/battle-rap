import express, { type Router } from 'express';

import {
  addParticipantHandler,
  addTrackHandler,
  create,
  list,
  listParticipantsHandler,
  listTracksHandler
} from '../controllers/matchController';
import { requireAuth, requireRoles } from '../middleware/authMiddleware';

const router = express.Router();

router.post(
  '/rounds/:roundId/matches',
  requireAuth,
  requireRoles(['admin', 'moderator']),
  create
);
router.get('/rounds/:roundId/matches', requireAuth, list);

router.post(
  '/matches/:matchId/participants',
  requireAuth,
  requireRoles(['admin', 'moderator']),
  addParticipantHandler
);
router.get('/matches/:matchId/participants', requireAuth, listParticipantsHandler);

router.post(
  '/matches/:matchId/tracks',
  requireAuth,
  requireRoles(['artist', 'admin', 'moderator']),
  addTrackHandler
);
router.get('/matches/:matchId/tracks', requireAuth, listTracksHandler);

export const matchRoutes: Router = router;
