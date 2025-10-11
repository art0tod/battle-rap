const express = require('express');

const {
  saveDraftHandler,
  submitHandler,
  listHandler
} = require('../controllers/submissionController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/rounds/:roundId/submissions/draft', requireAuth, saveDraftHandler);
router.post('/rounds/:roundId/submissions/submit', requireAuth, submitHandler);
router.get('/rounds/:roundId/submissions', requireAuth, listHandler);

module.exports = { submissionRoutes: router };
