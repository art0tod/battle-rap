import 'dotenv/config';

import { createApp } from './app';
import { loadConfig } from './config/env';
import { logger } from './utils/logger';

function start(): void {
  const config = loadConfig();
  const app = createApp({ config });

  const port = config.http.port;
  app.listen(port, () => {
    logger.info(`Battle Rap API listening on port ${port}`);
  });
}

try {
  start();
} catch (error) {
  console.error('Failed to start API', error);
  process.exit(1);
}
