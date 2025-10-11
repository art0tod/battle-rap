const { Pool } = require('pg');

const { loadConfig } = require('../config/env');
const { logger } = require('../utils/logger');

let pool;

function getPool() {
  if (!pool) {
    const config = loadConfig();
    pool = new Pool({
      connectionString: config.db.connectionString,
      max: 10,
      ssl: config.env === 'production' ? { rejectUnauthorized: false } : false
    });
    pool.on('error', (err) => {
      logger.error('Unexpected database error', { error: err });
    });
  }
  return pool;
}

async function withClient(callback) {
  const client = await getPool().connect();
  try {
    return await callback(client);
  } finally {
    client.release();
  }
}

module.exports = { getPool, withClient };
