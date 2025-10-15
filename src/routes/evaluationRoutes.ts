import express, { type Router } from 'express';

import {
  evaluateMatchHandler,
  evaluateSubmissionHandler,
  listMatchEvaluationsHandler,
  listSubmissionEvaluationsHandler
} from '../controllers/evaluationController';
import { requireAuth, requireRoles } from '../middleware/authMiddleware';

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

export const evaluationRoutes: Router = router;
