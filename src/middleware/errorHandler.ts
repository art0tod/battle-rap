import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import { logger } from '../utils/logger';

export class HttpError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type ErrorLike = {
  status?: number;
  details?: unknown;
};

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
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

  const errorLike = err as ErrorLike;
  const status =
    err instanceof HttpError
      ? err.status
      : typeof errorLike.status === 'number'
        ? errorLike.status
        : 500;

  const message = err instanceof Error ? err.message : 'Something went wrong';
  const response: { error: { message: string; details?: unknown } } = {
    error: {
      message
    }
  };

  const details = err instanceof HttpError ? err.details : errorLike.details;
  if (details !== undefined) {
    response.error.details = details;
  }

  const metadata = {
    stack: err instanceof Error ? err.stack : undefined
  };
  if (status >= 500) {
    logger.error(message, metadata);
  } else {
    logger.warn(message, metadata);
  }

  res.status(status).json(response);
};
