const { ZodError } = require('zod');

const { logger } = require('../utils/logger');

class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ZodError) {
    const formatted = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message
    }));
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        details: formatted
      }
    });
  }

  const status = err.status || 500;
  const response = {
    error: {
      message: err.message || 'Something went wrong'
    }
  };

  if (err.details) {
    response.error.details = err.details;
  }

  if (status >= 500) {
    logger.error(err.message, { stack: err.stack });
  } else {
    logger.warn(err.message, { stack: err.stack });
  }

  res.status(status).json(response);
}

module.exports = { errorHandler, HttpError };
