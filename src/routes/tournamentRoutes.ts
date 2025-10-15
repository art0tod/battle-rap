import express, { type Router } from 'express';

import {
  assignJudge,
  create,
  list,
  listJudgesHandler,
  listParticipantsHandler,
  registerParticipant,
  show,
  updateStatus
} from '../controllers/tournamentController';
import { create as createRound, list as listRounds } from '../controllers/roundController';
import { allowRolesOrSelfBody, requireAuth, requireRoles } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', list);
router.post('/', requireAuth, requireRoles(['admin', 'moderator']), create);
router.get('/:tournamentId', show);
router.patch(
  '/:tournamentId/status',
  requireAuth,
  requireRoles(['admin', 'moderator']),
  updateStatus
);

router.post(
  '/:tournamentId/participants',
  requireAuth,
  allowRolesOrSelfBody(['admin', 'moderator'], 'userId'),
  registerParticipant
);
router.get('/:tournamentId/participants', requireAuth, listParticipantsHandler);

router.post(
  '/:tournamentId/judges',
  requireAuth,
  requireRoles(['admin', 'moderator']),
  assignJudge
);
router.get('/:tournamentId/judges', requireAuth, listJudgesHandler);

router.post(
  '/:tournamentId/rounds',
  requireAuth,
  requireRoles(['admin', 'moderator']),
  createRound
);
router.get('/:tournamentId/rounds', listRounds);

export const tournamentRoutes: Router = router;
