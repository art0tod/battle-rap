import type { RequestHandler } from 'express';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      message: 'Not found'
    }
  });
};
