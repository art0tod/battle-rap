import { HttpError } from '../../../src/middleware/errorHandler';

const loadConfigMock = jest.fn();
const signMock = jest.fn();
const verifyMock = jest.fn();

jest.mock('../../../src/config/env', () => ({
  loadConfig: loadConfigMock
}));

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    sign: signMock,
    verify: verifyMock
  },
  sign: signMock,
  verify: verifyMock
}));

const defaultConfig = {
  env: 'test',
  http: { port: 3000 },
  security: { jwtSecret: 'test-secret-000000000000000000000000', jwtExpiresIn: '45m' },
  hashing: { saltRounds: 10 },
  db: { connectionString: 'postgres://example' }
};

describe('tokenService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    loadConfigMock.mockReturnValue(defaultConfig);
  });

  it('issues JWTs with expected payload and options', async () => {
    signMock.mockReturnValue('signed-token');
    const { issueToken } = await import('../../../src/services/tokenService');
    const token = issueToken({
      id: 'user-123',
      email: 'artist@example.com',
      roles: ['artist']
    });
    expect(signMock).toHaveBeenCalledWith(
      {
        sub: 'user-123',
        email: 'artist@example.com',
        roles: ['artist']
      },
      defaultConfig.security.jwtSecret,
      { expiresIn: defaultConfig.security.jwtExpiresIn }
    );
    expect(token).toBe('signed-token');
  });

  it('verifies JWTs and returns the decoded payload', async () => {
    const payload = { sub: 'user-456', email: 'listener@example.com', roles: ['listener'] };
    verifyMock.mockReturnValue(payload);
    const { verifyToken } = await import('../../../src/services/tokenService');
    const result = verifyToken('token-value');
    expect(verifyMock).toHaveBeenCalledWith('token-value', defaultConfig.security.jwtSecret);
    expect(result).toEqual(payload);
  });

  it('throws HttpError when the decoded payload is a string', async () => {
    verifyMock.mockReturnValue('decoded-string');
    const { verifyToken } = await import('../../../src/services/tokenService');
    let caught: unknown;
    try {
      verifyToken('token-value');
    } catch (error) {
      caught = error;
    }
    expect(verifyMock).toHaveBeenCalledWith('token-value', defaultConfig.security.jwtSecret);
    expect(caught).toBeDefined();
    const httpError = caught as HttpError;
    expect(httpError.status).toBe(401);
    expect(httpError.message).toBe('Invalid token payload');
  });
});
