import express, { type Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { createRouter } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/authMiddleware';
import { notFoundHandler } from './middleware/notFoundHandler';
import { type AppConfig } from './config/env';

interface CreateAppOptions {
  config: AppConfig;
}

export function createApp({ config }: CreateAppOptions): Express {
  const app = express();

  app.set('trust proxy', true);
  app.use(helmet());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: false }));
  app.use(
    morgan('dev', {
      skip: () => config.env === 'test'
    })
  );
  app.use(authenticate);

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', createRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
