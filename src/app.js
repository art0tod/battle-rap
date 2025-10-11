const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const { createRouter } = require('./routes');
const { notFoundHandler } = require('./middleware/notFoundHandler');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/authMiddleware');

function createApp({ config }) {
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

  app.use('/api', createRouter({ config }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
