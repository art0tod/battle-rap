import { Pool, type PoolClient } from 'pg';

import { loadConfig } from '../config/env';
import { logger } from '../utils/logger';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const config = loadConfig();
    pool = new Pool({
      connectionString: config.db.connectionString,
      max: 10,
      ssl: config.env === 'production' ? { rejectUnauthorized: false } : false
    });
    pool.on('connect', (client) => {
      void client
        .query('SET search_path TO public')
        .catch((error) => {
          logger.error('Failed to set search_path on connect', { error });
        });
    });
    pool.on('error', (err) => {
      logger.error('Unexpected database error', { error: err });
    });
  }
  return pool;
}

export async function withClient<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    return await callback(client);
  } finally {
    client.release();
  }
}
