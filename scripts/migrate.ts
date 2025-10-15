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
      const statements = extractMigrationStatements(sql);
      if (!statements.up) {
        logger.warn(`Skipping migration ${file}: no up statements found`);
        continue;
      }
      logger.info(`Running migration ${file}`);
      await pool.query(statements.up);
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

interface MigrationStatements {
  up: string;
  down: string | null;
}

function extractMigrationStatements(content: string): MigrationStatements {
  const markerUp = /--\s*migrate:up/i;
  const markerDown = /--\s*migrate:down/i;

  const hasMarkerUp = markerUp.test(content);
  const hasMarkerDown = markerDown.test(content);

  if (!hasMarkerUp && !hasMarkerDown) {
    return { up: content, down: null };
  }

  let up = '';
  let down = '';

  if (hasMarkerUp) {
    const upMatch = content.split(markerUp)[1] ?? '';
    const upSection = hasMarkerDown ? upMatch.split(markerDown)[0] ?? '' : upMatch;
    up = upSection.trim();
  }

  if (hasMarkerDown) {
    const downMatch = content.split(markerDown)[1] ?? '';
    down = downMatch.trim();
  }

  return { up, down: down || null };
}
