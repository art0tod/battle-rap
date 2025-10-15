import express, { type Router } from 'express';

import { login, register } from '../controllers/authController';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

export const authRoutes: Router = router;
