import { z } from 'zod';

jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

import { errorHandler, HttpError } from '../../../src/middleware/errorHandler';
import { logger } from '../../../src/utils/logger';

const warnMock = logger.warn as jest.Mock;
const errorMock = logger.error as jest.Mock;

type MockResponse = {
  status: jest.Mock;
  json: jest.Mock;
  headersSent: boolean;
};

function createResponse(overrides: Partial<Pick<MockResponse, 'headersSent'>> = {}): MockResponse {
  const response: MockResponse = {
    status: jest.fn(),
    json: jest.fn(),
    headersSent: overrides.headersSent ?? false
  };
  response.status.mockReturnValue(response);
  return response;
}

describe('errorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('formats validation errors from Zod', () => {
    const schema = z.object({ email: z.string().email() });
    const parseResult = schema.safeParse({ email: 'not-an-email' });
    if (parseResult.success) {
      throw new Error('Expected schema parsing to fail');
    }
    const res = createResponse();
    const next = jest.fn();
    errorHandler(parseResult.error, {} as never, res as never, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: 'Validation failed',
        details: [
          {
            path: 'email',
            message: expect.any(String)
          }
        ]
      }
    });
    expect(next).not.toHaveBeenCalled();
    expect(warnMock).not.toHaveBeenCalled();
    expect(errorMock).not.toHaveBeenCalled();
  });

  it('delegates to next when headers already sent', () => {
    const res = createResponse({ headersSent: true });
    const next = jest.fn();
    const error = new Error('late failure');
    errorHandler(error, {} as never, res as never, next);
    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('handles HttpError with client status and details', () => {
    const res = createResponse();
    const next = jest.fn();
    const err = new HttpError(404, 'Not found', { resource: 'user' });
    errorHandler(err, {} as never, res as never, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: 'Not found',
        details: { resource: 'user' }
      }
    });
    expect(warnMock).toHaveBeenCalledWith('Not found', expect.objectContaining({ stack: expect.any(String) }));
    expect(errorMock).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('logs server errors with logger.error', () => {
    const res = createResponse();
    const next = jest.fn();
    const err = new Error('Boom');
    errorHandler(err, {} as never, res as never, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: 'Boom'
      }
    });
    expect(errorMock).toHaveBeenCalledWith('Boom', expect.objectContaining({ stack: expect.any(String) }));
    expect(warnMock).not.toHaveBeenCalled();
  });
});
