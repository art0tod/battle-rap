#!/usr/bin/env node

import 'dotenv/config';

import fs from 'fs';
import path from 'path';

import { getPool } from '../src/db/pool';
import { logger } from '../src/utils/logger';

async function runMigrations(): Promise<void> {
  const sqlDir = path.resolve(__dirname, '../sql');
  const files = fs
    .readdirSync(sqlDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    logger.warn('No SQL files found in /sql');
    return;
  }

  const pool = getPool();
  try {
    for (const file of files) {
      const fullPath = path.join(sqlDir, file);
      const sql = fs.readFileSync(fullPath, 'utf-8');
      logger.info(`Running migration ${file}`);
      await pool.query(sql);
    }
    logger.info('Migrations completed');
  } finally {
    await pool.end();
  }
}

runMigrations().catch((err: unknown) => {
  console.error('Migration failed', err);
  process.exit(1);
});
