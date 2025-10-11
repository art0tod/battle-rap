const express = require('express');

const {
  evaluateSubmissionHandler,
  evaluateMatchHandler,
  listSubmissionEvaluationsHandler,
  listMatchEvaluationsHandler
} = require('../controllers/evaluationController');
const { requireAuth, requireRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
  '/evaluations/submission/:submissionId',
  requireAuth,
  requireRoles(['judge', 'admin', 'moderator']),
  evaluateSubmissionHandler
);

router.post(
  '/evaluations/match/:matchId',
  requireAuth,
  requireRoles(['judge', 'admin', 'moderator']),
  evaluateMatchHandler
);

router.get(
  '/evaluations/submission/:submissionId',
  requireAuth,
  listSubmissionEvaluationsHandler
);

router.get(
  '/evaluations/match/:matchId',
  requireAuth,
  listMatchEvaluationsHandler
);

module.exports = { evaluationRoutes: router };
