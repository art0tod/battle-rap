import express, { type Router } from 'express';

import {
  listHandler,
  saveDraftHandler,
  submitHandler
} from '../controllers/submissionController';
import { requireAuth } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/rounds/:roundId/submissions/draft', requireAuth, saveDraftHandler);
router.post('/rounds/:roundId/submissions/submit', requireAuth, submitHandler);
router.get('/rounds/:roundId/submissions', requireAuth, listHandler);

export const submissionRoutes: Router = router;
