const { getPool } = require('../db');
const { HttpError } = require('../middleware/errorHandler');

const MEDIA_KINDS = ['audio', 'image'];

function mapMedia(row) {
  if (!row) return null;
  return {
    id: row.id,
    kind: row.kind,
    storageKey: row.storage_key,
    mime: row.mime,
    sizeBytes: row.size_bytes,
    durationSec: row.duration_sec,
    createdAt: row.created_at
  };
}

async function createMediaAsset({ kind, storageKey, mime, sizeBytes, durationSec }) {
  if (!MEDIA_KINDS.includes(kind)) {
    throw new HttpError(400, `Unsupported media kind: ${kind}`);
  }
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO media_asset (kind, storage_key, mime, size_bytes, duration_sec)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      kind,
      storageKey,
      mime,
      sizeBytes,
      kind === 'audio' ? durationSec ?? null : null
    ]
  );
  return mapMedia(result.rows[0]);
}

async function getMediaAssetById(id) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT *
     FROM media_asset
     WHERE id = $1`,
    [id]
  );
  return mapMedia(result.rows[0]);
}

async function listMediaAssets({ kind } = {}) {
  const pool = getPool();
  if (kind) {
    if (!MEDIA_KINDS.includes(kind)) {
      throw new HttpError(400, `Unsupported media kind: ${kind}`);
    }
    const result = await pool.query(
      `SELECT *
       FROM media_asset
       WHERE kind = $1
       ORDER BY created_at DESC`,
      [kind]
    );
    return result.rows.map(mapMedia);
  }
  const result = await pool.query(
    `SELECT *
     FROM media_asset
     ORDER BY created_at DESC`
  );
  return result.rows.map(mapMedia);
}

module.exports = {
  MEDIA_KINDS,
  createMediaAsset,
  getMediaAssetById,
  listMediaAssets
};
