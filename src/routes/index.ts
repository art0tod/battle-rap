import express, { type Router } from 'express';

import { adminRoutes } from './adminRoutes';
import { authRoutes } from './authRoutes';
import { evaluationRoutes } from './evaluationRoutes';
import { matchRoutes } from './matchRoutes';
import { roundRoutes } from './roundRoutes';
import { submissionRoutes } from './submissionRoutes';
import { tournamentRoutes } from './tournamentRoutes';
import { userRoutes } from './userRoutes';

export function createRouter(): Router {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.json({ name: 'Battle Rap API', version: '0.1.0' });
  });

  router.use('/auth', authRoutes);
  router.use('/users', userRoutes);
  router.use('/admin', adminRoutes);
  router.use('/tournaments', tournamentRoutes);
  router.use('/rounds', roundRoutes);
  router.use('/', matchRoutes);
  router.use('/', submissionRoutes);
  router.use('/', evaluationRoutes);

  return router;
}
