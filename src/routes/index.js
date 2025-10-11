const express = require('express');

const { authRoutes } = require('./authRoutes');
const { userRoutes } = require('./userRoutes');
const { tournamentRoutes } = require('./tournamentRoutes');
const { matchRoutes } = require('./matchRoutes');
const { submissionRoutes } = require('./submissionRoutes');
const { evaluationRoutes } = require('./evaluationRoutes');

function createRouter() {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.json({ name: 'Battle Rap API', version: '0.1.0' });
  });

  router.use('/auth', authRoutes);
  router.use('/users', userRoutes);
  router.use('/tournaments', tournamentRoutes);
  router.use('/', matchRoutes);
  router.use('/', submissionRoutes);
  router.use('/', evaluationRoutes);

  return router;
}

module.exports = { createRouter };
