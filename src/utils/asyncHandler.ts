import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ParsedQs } from 'qs';

export type AsyncHandler<
  P = Record<string, unknown>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = ParsedQs
> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response<ResBody>,
  next: NextFunction
) => Promise<unknown>;

export function asyncHandler<
  P = Record<string, unknown>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = ParsedQs
>(fn: AsyncHandler<P, ResBody, ReqBody, ReqQuery>): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
  return (req, res, next) => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
}
