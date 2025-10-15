import express, { type Router } from 'express';

import {
  createMediaAsset,
  dashboard,
  listMediaAssetsHandler,
  listUsers,
  moderateSubmission
} from '../controllers/adminController';
import { requireAuth, requireRoles } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/dashboard', requireAuth, requireRoles(['admin']), dashboard);

router.get('/users', requireAuth, requireRoles(['admin']), listUsers);

router.patch(
  '/submissions/:submissionId/moderation',
  requireAuth,
  requireRoles(['admin']),
  moderateSubmission
);

router.post('/media-assets', requireAuth, requireRoles(['admin']), createMediaAsset);

router.get('/media-assets', requireAuth, requireRoles(['admin']), listMediaAssetsHandler);

export const adminRoutes: Router = router;
