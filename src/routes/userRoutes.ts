import express, { type Router } from 'express';

import { getProfile, upsertProfile } from '../controllers/artistController';
import { addUserRoles, getMe, getUser, replaceUserRoles } from '../controllers/userController';
import {
  allowSelfOrRoles,
  requireAuth,
  requireRoles
} from '../middleware/authMiddleware';

const router = express.Router();

router.get('/me', requireAuth, getMe);
router.get('/:userId', requireAuth, allowSelfOrRoles(['admin', 'moderator']), getUser);
router.post('/:userId/roles', requireAuth, requireRoles(['admin']), addUserRoles);
router.put('/:userId/roles', requireAuth, requireRoles(['admin']), replaceUserRoles);
router.get(
  '/:userId/artist-profile',
  requireAuth,
  allowSelfOrRoles(['admin', 'moderator']),
  getProfile
);
router.put(
  '/:userId/artist-profile',
  requireAuth,
  allowSelfOrRoles(['admin', 'moderator']),
  upsertProfile
);

export const userRoutes: Router = router;
