import { asyncHandler } from '../../../src/utils/asyncHandler';

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('asyncHandler', () => {
  it('invokes the wrapped handler and does not call next on success', async () => {
    const req = { path: '/test' } as any;
    const res = {} as any;
    const handler = jest.fn().mockResolvedValue(undefined);
    const next = jest.fn();
    const wrapped = asyncHandler(handler);
    wrapped(req, res, next);
    await flushPromises();
    expect(handler).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('passes rejected promises to next', async () => {
    const error = new Error('boom');
    const handler = jest.fn().mockRejectedValue(error);
    const next = jest.fn();
    const wrapped = asyncHandler(handler);
    wrapped({} as any, {} as any, next);
    await flushPromises();
    expect(next).toHaveBeenCalledWith(error);
  });
});
