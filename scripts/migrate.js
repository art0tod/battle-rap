#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const { getPool } = require('../src/db/pool');
const { logger } = require('../src/utils/logger');

async function runMigrations() {
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
  for (const file of files) {
    const fullPath = path.join(sqlDir, file);
    const sql = fs.readFileSync(fullPath, 'utf-8');
    logger.info(`Running migration ${file}`);
    await pool.query(sql);
  }
  await pool.end();
  logger.info('Migrations completed');
}

runMigrations().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Migration failed', err);
  process.exit(1);
});
