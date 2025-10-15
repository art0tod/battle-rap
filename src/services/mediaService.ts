import { getPool } from '../db';
import { HttpError } from '../middleware/errorHandler';

export const MEDIA_KINDS = ['audio', 'image'] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

export interface MediaAsset {
  id: string;
  kind: MediaKind;
  storageKey: string;
  mime: string;
  sizeBytes: number;
  durationSec: number | null;
  createdAt: Date;
}

interface MediaRow {
  id: string;
  kind: MediaKind;
  storage_key: string;
  mime: string;
  size_bytes: number;
  duration_sec: number | null;
  created_at: Date;
}

function mapMedia(row?: MediaRow | null): MediaAsset | null {
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

export interface CreateMediaAssetParams {
  kind: MediaKind;
  storageKey: string;
  mime: string;
  sizeBytes: number;
  durationSec?: number | null;
}

export async function createMediaAsset({
  kind,
  storageKey,
  mime,
  sizeBytes,
  durationSec
}: CreateMediaAssetParams): Promise<MediaAsset | null> {
  if (!MEDIA_KINDS.includes(kind)) {
    throw new HttpError(400, `Unsupported media kind: ${kind}`);
  }
  const pool = getPool();
  const result = await pool.query<MediaRow>(
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

export async function getMediaAssetById(id: string): Promise<MediaAsset | null> {
  const pool = getPool();
  const result = await pool.query<MediaRow>(
    `SELECT *
     FROM media_asset
     WHERE id = $1`,
    [id]
  );
  return mapMedia(result.rows[0]);
}

export interface ListMediaAssetsParams {
  kind?: MediaKind;
}

export async function listMediaAssets({
  kind
}: ListMediaAssetsParams = {}): Promise<MediaAsset[]> {
  const pool = getPool();
  if (kind) {
    if (!MEDIA_KINDS.includes(kind)) {
      throw new HttpError(400, `Unsupported media kind: ${kind}`);
    }
    const result = await pool.query<MediaRow>(
      `SELECT *
       FROM media_asset
       WHERE kind = $1
       ORDER BY created_at DESC`,
      [kind]
    );
    return result.rows
      .map((row) => mapMedia(row))
      .filter((asset): asset is MediaAsset => asset !== null);
  }
  const result = await pool.query<MediaRow>(
    `SELECT *
     FROM media_asset
     ORDER BY created_at DESC`
  );
  return result.rows
    .map((row) => mapMedia(row))
    .filter((asset): asset is MediaAsset => asset !== null);
}
