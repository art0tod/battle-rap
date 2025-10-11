require('dotenv').config();

const { createApp } = require('./app');
const { loadConfig } = require('./config/env');
const { logger } = require('./utils/logger');

async function start() {
  const config = loadConfig();
  const app = createApp({ config });

  const port = config.http.port;
  app.listen(port, () => {
    logger.info(`Battle Rap API listening on port ${port}`);
  });
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start API', error);
  process.exit(1);
});
