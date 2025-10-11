const express = require('express');

const {
  list,
  create,
  show,
  updateStatus,
  registerParticipant,
  assignJudge,
  listParticipantsHandler,
  listJudgesHandler
} = require('../controllers/tournamentController');
const { create: createRound, list: listRounds } = require('../controllers/roundController');
const { requireAuth, requireRoles, allowRolesOrSelfBody } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, list);
router.post('/', requireAuth, requireRoles(['admin', 'moderator']), create);
router.get('/:tournamentId', requireAuth, show);
router.patch('/:tournamentId/status', requireAuth, requireRoles(['admin', 'moderator']), updateStatus);

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
router.get('/:tournamentId/rounds', requireAuth, listRounds);

module.exports = { tournamentRoutes: router };
