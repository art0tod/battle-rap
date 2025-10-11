const express = require('express');

const {
  getMe,
  getUser,
  addUserRoles,
  replaceUserRoles
} = require('../controllers/userController');
const {
  getProfile,
  upsertProfile
} = require('../controllers/artistController');
const {
  requireAuth,
  requireRoles,
  allowSelfOrRoles
} = require('../middleware/authMiddleware');

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

module.exports = { userRoutes: router };
