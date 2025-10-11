const express = require('express');

const {
  create,
  list,
  addParticipantHandler,
  listParticipantsHandler,
  addTrackHandler,
  listTracksHandler
} = require('../controllers/matchController');
const { requireAuth, requireRoles } = require('../middleware/authMiddleware');

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

module.exports = { matchRoutes: router };
