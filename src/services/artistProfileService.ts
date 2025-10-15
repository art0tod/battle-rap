import { getPool } from '../db';

export interface ArtistSocials {
  [key: string]: string | undefined;
}

export interface ArtistProfile {
  userId: string;
  avatarKey: string | null;
  bio: string | null;
  socials: ArtistSocials;
}

interface ArtistProfileRow {
  user_id: string;
  avatar_key: string | null;
  bio: string | null;
  socials: ArtistSocials | null;
}

function mapProfile(row?: ArtistProfileRow | null): ArtistProfile | null {
  if (!row) return null;
  return {
    userId: row.user_id,
    avatarKey: row.avatar_key,
    bio: row.bio,
    socials: row.socials ?? {}
  };
}

export async function getArtistProfile(userId: string): Promise<ArtistProfile | null> {
  const pool = getPool();
  const result = await pool.query<ArtistProfileRow>(
    `SELECT user_id, avatar_key, bio, socials
     FROM artist_profile
     WHERE user_id = $1`,
    [userId]
  );
  return mapProfile(result.rows[0]);
}

export interface UpsertArtistProfilePayload {
  avatarKey?: string | null;
  bio?: string | null;
  socials?: ArtistSocials | null;
}

export async function upsertArtistProfile(
  userId: string,
  payload: UpsertArtistProfilePayload
): Promise<ArtistProfile | null> {
  const pool = getPool();
  const result = await pool.query<ArtistProfileRow>(
    `INSERT INTO artist_profile (user_id, avatar_key, bio, socials)
     VALUES ($1, $2, $3, $4::jsonb)
     ON CONFLICT (user_id)
     DO UPDATE SET
       avatar_key = EXCLUDED.avatar_key,
       bio = EXCLUDED.bio,
       socials = EXCLUDED.socials
     RETURNING user_id, avatar_key, bio, socials`,
    [
      userId,
      payload.avatarKey ?? null,
      payload.bio ?? null,
      JSON.stringify(payload.socials ?? {})
    ]
  );
  return mapProfile(result.rows[0]);
}
