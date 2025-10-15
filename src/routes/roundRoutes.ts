import express, { type Router } from 'express';

import { listCriteria, show } from '../controllers/roundController';

const router = express.Router();

router.get('/:roundId/criteria', listCriteria);
router.get('/:roundId', show);

export const roundRoutes: Router = router;
