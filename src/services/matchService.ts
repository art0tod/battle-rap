import { getPool, transaction } from '../db';
import { HttpError } from '../middleware/errorHandler';

export interface Match {
  id: string;
  roundId: string;
  startsAt: Date | null;
}

interface MatchRow {
  id: string;
  round_id: string;
  starts_at: Date | null;
}

interface MatchParticipantRow {
  match_id: string;
  participant_id: string;
  seed: number | null;
  display_name?: string;
}

export interface MatchParticipant {
  matchId: string;
  participantId: string;
  seed: number | null;
  displayName?: string;
}

interface MatchTrackRow {
  id: string;
  match_id: string;
  participant_id: string;
  audio_id: string | null;
  lyrics: string | null;
  submitted_at: Date | null;
}

export interface MatchTrack {
  id: string;
  matchId: string;
  participantId: string;
  audioId: string | null;
  lyrics: string | null;
  submittedAt: Date | null;
}

function mapMatch(row?: MatchRow | null): Match | null {
  if (!row) return null;
  return {
    id: row.id,
    roundId: row.round_id,
    startsAt: row.starts_at
  };
}

function mapMatchTrack(row?: MatchTrackRow | null): MatchTrack | null {
  if (!row) return null;
  return {
    id: row.id,
    matchId: row.match_id,
    participantId: row.participant_id,
    audioId: row.audio_id,
    lyrics: row.lyrics,
    submittedAt: row.submitted_at
  };
}

interface CreateMatchParams {
  roundId: string;
  startsAt?: Date | string | null;
}

export async function createMatch({ roundId, startsAt }: CreateMatchParams): Promise<Match | null> {
  const pool = getPool();
  const normalizedStartsAt =
    typeof startsAt === 'string' ? new Date(startsAt) : startsAt ?? null;
  const result = await pool.query<MatchRow>(
    `INSERT INTO match (round_id, starts_at)
     VALUES ($1, $2)
     RETURNING id, round_id, starts_at`,
    [roundId, normalizedStartsAt]
  );
  return mapMatch(result.rows[0]);
}

interface AddMatchParticipantParams {
  matchId: string;
  participantId: string;
  seed?: number | null;
}

export async function addMatchParticipant({
  matchId,
  participantId,
  seed
}: AddMatchParticipantParams): Promise<MatchParticipant> {
  try {
    const pool = getPool();
    const result = await pool.query<MatchParticipantRow>(
      `INSERT INTO match_participant (match_id, participant_id, seed)
       VALUES ($1, $2, $3)
       RETURNING match_id, participant_id, seed`,
      [matchId, participantId, seed ?? null]
    );
    const row = result.rows[0];
    return {
      matchId: row.match_id,
      participantId: row.participant_id,
      seed: row.seed ?? null
    };
  } catch (error: unknown) {
    if (isDatabaseConflictError(error)) {
      throw new HttpError(409, 'Participant already assigned to match or duplicate seed');
    }
    throw error;
  }
}

export async function listMatchParticipants(matchId: string): Promise<MatchParticipant[]> {
  const pool = getPool();
  const result = await pool.query<MatchParticipantRow>(
    `SELECT mp.match_id, mp.participant_id, mp.seed, u.display_name
     FROM match_participant mp
     JOIN tournament_participant tp ON tp.id = mp.participant_id
     JOIN app_user u ON u.id = tp.user_id
     WHERE mp.match_id = $1
     ORDER BY mp.seed NULLS LAST, u.display_name`,
    [matchId]
  );
  return result.rows.map((row) => ({
    matchId: row.match_id,
    participantId: row.participant_id,
    seed: row.seed ?? null,
    displayName: row.display_name
  }));
}

export async function listMatchesByRound(roundId: string): Promise<Match[]> {
  const pool = getPool();
  const result = await pool.query<MatchRow>(
    `SELECT id, round_id, starts_at
     FROM match
     WHERE round_id = $1
     ORDER BY starts_at`,
    [roundId]
  );
  return result.rows
    .map((row) => mapMatch(row))
    .filter((match): match is Match => match !== null);
}

interface CreateMatchTrackParams {
  matchId: string;
  participantId: string;
  audioId?: string | null;
  lyrics?: string | null;
}

export async function createMatchTrack({
  matchId,
  participantId,
  audioId,
  lyrics
}: CreateMatchTrackParams): Promise<MatchTrack | null> {
  return transaction(async (client) => {
    const result = await client.query<MatchTrackRow>(
      `INSERT INTO match_track (match_id, participant_id, audio_id, lyrics)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [matchId, participantId, audioId ?? null, lyrics ?? null]
    );
    return mapMatchTrack(result.rows[0]);
  });
}

export async function listMatchTracks(matchId: string): Promise<MatchTrack[]> {
  const pool = getPool();
  const result = await pool.query<MatchTrackRow>(
    `SELECT *
     FROM match_track
     WHERE match_id = $1`,
    [matchId]
  );
  return result.rows
    .map((row) => mapMatchTrack(row))
    .filter((track): track is MatchTrack => track !== null);
}

function isDatabaseConflictError(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === '23505'
  );
}
