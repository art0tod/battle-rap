import type { AppConfig } from '../../../src/config/env';

const ORIGINAL_ENV = process.env;

function buildEnv(overrides: Partial<NodeJS.ProcessEnv> = {}): NodeJS.ProcessEnv {
  return {
    ...ORIGINAL_ENV,
    NODE_ENV: 'test',
    PORT: '4000',
    DATABASE_URL: 'postgres://user:pass@localhost:5432/battle',
    JWT_SECRET: '12345678901234567890123456789012',
    JWT_EXPIRES_IN: '2h',
    ...overrides
  };
}

async function loadModule() {
  return import('../../../src/config/env');
}

describe('loadConfig', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = buildEnv();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('parses environment variables into AppConfig', async () => {
    const { loadConfig } = await loadModule();
    const config = loadConfig();
    const expected: AppConfig = {
      env: 'test',
      http: { port: 4000 },
      security: {
        jwtSecret: '12345678901234567890123456789012',
        jwtExpiresIn: '2h'
      },
      hashing: { saltRounds: 12 },
      db: { connectionString: 'postgres://user:pass@localhost:5432/battle' }
    };
    expect(config).toEqual(expected);
  });

  it('throws with helpful message when environment invalid', async () => {
    process.env = buildEnv({ DATABASE_URL: undefined });
    const { loadConfig } = await loadModule();
    expect(() => loadConfig()).toThrow('Invalid environment');
  });

  it('caches the parsed configuration across calls', async () => {
    const { loadConfig } = await loadModule();
    const first = loadConfig();
    process.env = buildEnv({ JWT_SECRET: 'different-secret-that-should-not-apply' });
    const second = loadConfig();
    expect(second).toBe(first);
  });
});
