import { HttpError } from '../../../src/middleware/errorHandler';

const loadConfigMock = jest.fn();
const hashMock = jest.fn();
const compareMock = jest.fn();
const createUserMock = jest.fn();
const getUserByEmailMock = jest.fn();

jest.mock('../../../src/config/env', () => ({
  loadConfig: loadConfigMock
}));

jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    hash: hashMock,
    compare: compareMock
  }
}));

jest.mock('../../../src/services/userService', () => ({
  createUser: createUserMock,
  getUserByEmail: getUserByEmailMock
}));

const baseConfig = {
  env: 'test',
  http: { port: 3000 },
  security: { jwtSecret: 'secret', jwtExpiresIn: '1h' },
  hashing: { saltRounds: 8 },
  db: { connectionString: 'postgres://example' }
};

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    loadConfigMock.mockReturnValue(baseConfig);
  });

  it('registerUser hashes the password and delegates to createUser', async () => {
    hashMock.mockResolvedValue('hashed-password');
    const createdUser = {
      id: 'user-1',
      email: 'user@example.com',
      displayName: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
      roles: ['artist']
    };
    createUserMock.mockResolvedValue(createdUser);
    const { registerUser } = await import('../../../src/services/authService');
    const result = await registerUser({
      email: 'user@example.com',
      password: 'plain-pass',
      displayName: 'Test User',
      roles: ['artist']
    });
    expect(loadConfigMock).toHaveBeenCalled();
    expect(hashMock).toHaveBeenCalledWith('plain-pass', baseConfig.hashing.saltRounds);
    expect(createUserMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      passwordHash: 'hashed-password',
      displayName: 'Test User',
      roles: ['artist']
    });
    expect(result).toEqual(createdUser);
  });

  it('registerUser passes an empty role list when roles omitted', async () => {
    hashMock.mockResolvedValue('other-hash');
    createUserMock.mockResolvedValue({
      id: 'user-2',
      email: 'second@example.com',
      displayName: 'Second User',
      createdAt: new Date(),
      updatedAt: new Date(),
      roles: ['listener']
    });
    const { registerUser } = await import('../../../src/services/authService');
    await registerUser({
      email: 'second@example.com',
      password: 'secret',
      displayName: 'Second User'
    });
    expect(createUserMock).toHaveBeenCalledWith({
      email: 'second@example.com',
      passwordHash: 'other-hash',
      displayName: 'Second User',
      roles: []
    });
  });

  it('authenticateUser returns the sanitized user when credentials valid', async () => {
    const userRecord = {
      id: 'user-3',
      email: 'login@example.com',
      displayName: 'Login User',
      createdAt: new Date(),
      updatedAt: new Date(),
      roles: ['judge'],
      passwordHash: 'stored-hash'
    };
    getUserByEmailMock.mockResolvedValue(userRecord);
    compareMock.mockResolvedValue(true);
    const { authenticateUser } = await import('../../../src/services/authService');
    const result = await authenticateUser({ email: 'login@example.com', password: 'plain' });
    expect(getUserByEmailMock).toHaveBeenCalledWith('login@example.com');
    expect(compareMock).toHaveBeenCalledWith('plain', 'stored-hash');
    expect(result).toEqual({
      id: 'user-3',
      email: 'login@example.com',
      displayName: 'Login User',
      createdAt: userRecord.createdAt,
      updatedAt: userRecord.updatedAt,
      roles: ['judge']
    });
    const resultRecord = result as unknown as Record<string, unknown>;
    expect(resultRecord.passwordHash).toBeUndefined();
  });

  it('authenticateUser throws HttpError when user not found', async () => {
    getUserByEmailMock.mockResolvedValue(null);
    const { authenticateUser } = await import('../../../src/services/authService');
    await expect(
      authenticateUser({ email: 'missing@example.com', password: 'ignore' })
    ).rejects.toBeInstanceOf(HttpError);
  });

  it('authenticateUser throws HttpError when password invalid', async () => {
    const userRecord = {
      id: 'user-4',
      email: 'wrong@example.com',
      displayName: 'Wrong Password User',
      createdAt: new Date(),
      updatedAt: new Date(),
      roles: ['listener'],
      passwordHash: 'stored-hash'
    };
    getUserByEmailMock.mockResolvedValue(userRecord);
    compareMock.mockResolvedValue(false);
    const { authenticateUser } = await import('../../../src/services/authService');
    await expect(
      authenticateUser({ email: 'wrong@example.com', password: 'bad-pass' })
    ).rejects.toBeInstanceOf(HttpError);
  });
});
