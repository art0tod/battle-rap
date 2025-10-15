import { getPool } from '../db';
import { listUsers } from './userService';
import type { User } from './userService';
import {
  setSubmissionLock,
  type SetSubmissionLockParams,
  type Submission
} from './submissionService';
import {
  createMediaAsset,
  listMediaAssets,
  type CreateMediaAssetParams,
  type ListMediaAssetsParams,
  type MediaAsset
} from './mediaService';

interface UsersStatsRow {
  total: number;
  with_roles: number;
  artists: number;
}

interface TournamentStatsRow {
  total: number;
  active: number;
  finished: number;
}

interface SubmissionStatsRow {
  total: number;
  submitted: number;
  locked: number;
  disqualified: number;
}

interface MediaStatsRow {
  total: number;
  audio: number;
  image: number;
}

export interface DashboardStats {
  users: UsersStatsRow;
  tournaments: TournamentStatsRow;
  submissions: SubmissionStatsRow;
  mediaAssets: MediaStatsRow;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const pool = getPool();
  const [users, tournaments, submissions, mediaAssets] = await Promise.all([
    pool.query<UsersStatsRow>(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE array_length(roles.roles, 1) > 0)::int AS with_roles,
         COUNT(*) FILTER (WHERE roles.roles @> ARRAY['artist'])::int AS artists
       FROM (
         SELECT u.id, ARRAY_AGG(aur.role) FILTER (WHERE aur.role IS NOT NULL) AS roles
         FROM app_user u
         LEFT JOIN app_user_role aur ON aur.user_id = u.id
         GROUP BY u.id
       ) roles`
    ),
    pool.query<TournamentStatsRow>(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'active')::int AS active,
         COUNT(*) FILTER (WHERE status = 'finished')::int AS finished
       FROM tournament`
    ),
    pool.query<SubmissionStatsRow>(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'submitted')::int AS submitted,
         COUNT(*) FILTER (WHERE status = 'locked')::int AS locked,
         COUNT(*) FILTER (WHERE status = 'disqualified')::int AS disqualified
       FROM submission`
    ),
    pool.query<MediaStatsRow>(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE kind = 'audio')::int AS audio,
         COUNT(*) FILTER (WHERE kind = 'image')::int AS image
       FROM media_asset`
    )
  ]);

  return {
    users: users.rows[0],
    tournaments: tournaments.rows[0],
    submissions: submissions.rows[0],
    mediaAssets: mediaAssets.rows[0]
  };
}

export async function adminListUsers(): Promise<User[]> {
  return listUsers();
}

export async function adminSetSubmissionLock(params: SetSubmissionLockParams): Promise<Submission> {
  return setSubmissionLock(params);
}

export async function adminCreateMediaAsset(
  payload: CreateMediaAssetParams
): Promise<MediaAsset | null> {
  return createMediaAsset(payload);
}

export async function adminListMediaAssets(
  filter: ListMediaAssetsParams = {}
): Promise<MediaAsset[]> {
  return listMediaAssets(filter);
}
