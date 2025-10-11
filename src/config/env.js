const { z } = require('zod');

let cachedConfig = null;

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z
      .string()
      .default("3000")
      .transform((value) => Number.parseInt(value, 10)),
    DATABASE_URL: z.string().nonempty({ message: "DATABASE_URL is required" }),
    JWT_SECRET: z
      .string()
      .min(32, { message: "JWT_SECRET must be at least 32 characters" }),
    JWT_EXPIRES_IN: z.string().default("1d"),
    BCRYPT_ROUNDS: z
      .string()
      .optional()
      .transform((value) => (value ? Number.parseInt(value, 10) : 12)),
  })
  .transform((env) => ({
    env: env.NODE_ENV,
    http: {
      port: env.PORT,
    },
    security: {
      jwtSecret: env.JWT_SECRET,
      jwtExpiresIn: env.JWT_EXPIRES_IN,
    },
    hashing: {
      saltRounds: env.BCRYPT_ROUNDS,
    },
    db: {
      connectionString: env.DATABASE_URL,
    },
  }));

function loadConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }
  const parseResult = envSchema.safeParse(process.env);
  if (!parseResult.success) {
    const messages = parseResult.error.errors
      .map((issue) => issue.message)
      .join(', ');
    throw new Error(
      `Invalid environment: ${messages || 'Check required environment variables'}`
    );
  }
  cachedConfig = parseResult.data;
  return cachedConfig;
}

module.exports = { loadConfig };
