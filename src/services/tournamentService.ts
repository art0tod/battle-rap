import type { PoolClient } from 'pg';

import { getPool, transaction } from '../db';
import { HttpError } from '../middleware/errorHandler';

export type TournamentStatus = 'draft' | 'active' | 'finished';

export interface Tournament {
  id: string;
  title: string;
  maxBracketSize: number;
  status: TournamentStatus;
  createdAt: Date;
}

interface TournamentRow {
  id: string;
  title: string;
  max_bracket_size: number;
  status: TournamentStatus;
  created_at: Date;
}

function mapTournament(row?: TournamentRow | null): Tournament | null {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    maxBracketSize: row.max_bracket_size,
    status: row.status,
    createdAt: row.created_at
  };
}

export async function listTournaments(): Promise<Tournament[]> {
  const pool = getPool();
  const result = await pool.query<TournamentRow>(
    `SELECT id, title, max_bracket_size, status, created_at
     FROM tournament
     ORDER BY created_at DESC`
  );
  return result.rows
    .map((row) => mapTournament(row))
    .filter((tournament): tournament is Tournament => tournament !== null);
}

export async function getTournamentById(id: string): Promise<Tournament | null> {
  const pool = getPool();
  const result = await pool.query<TournamentRow>(
    `SELECT id, title, max_bracket_size, status, created_at
     FROM tournament WHERE id = $1`,
    [id]
  );
  return mapTournament(result.rows[0]);
}

interface CreateTournamentParams {
  title: string;
  maxBracketSize: number;
}

export async function createTournament({
  title,
  maxBracketSize
}: CreateTournamentParams): Promise<Tournament | null> {
  if (![128, 256].includes(maxBracketSize)) {
    throw new HttpError(400, 'maxBracketSize must be 128 or 256');
  }
  const pool = getPool();
  const result = await pool.query<TournamentRow>(
    `INSERT INTO tournament (title, max_bracket_size)
     VALUES ($1, $2)
     RETURNING id, title, max_bracket_size, status, created_at`,
    [title, maxBracketSize]
  );
  return mapTournament(result.rows[0]);
}

export async function setTournamentStatus(
  id: string,
  status: TournamentStatus
): Promise<Tournament> {
  const allowed: TournamentStatus[] = ['draft', 'active', 'finished'];
  if (!allowed.includes(status)) {
    throw new HttpError(400, `Unsupported status: ${status}`);
  }
  const pool = getPool();
  const result = await pool.query<TournamentRow>(
    `UPDATE tournament SET status = $2 WHERE id = $1
     RETURNING id, title, max_bracket_size, status, created_at`,
    [id, status]
  );
  const tournament = mapTournament(result.rows[0]);
  if (!tournament) {
    throw new HttpError(404, 'Tournament not found');
  }
  return tournament;
}

interface ParticipantRow {
  id: string;
  tournament_id: string;
  user_id: string;
}

interface AddParticipantParams {
  tournamentId: string;
  userId: string;
}

export async function addParticipant({
  tournamentId,
  userId
}: AddParticipantParams): Promise<ParticipantRow> {
  return transaction(async (client) => {
    await ensureTournamentExists(client, tournamentId);
    const result = await client.query<ParticipantRow>(
      `INSERT INTO tournament_participant (tournament_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (tournament_id, user_id) DO NOTHING
       RETURNING id, tournament_id, user_id`,
      [tournamentId, userId]
    );
    const participant = result.rows[0];
    if (!participant) {
      throw new HttpError(409, 'User already registered for tournament');
    }
    return participant;
  });
}

interface JudgeRow {
  tournament_id: string;
  user_id: string;
}

interface AddJudgeParams {
  tournamentId: string;
  userId: string;
}

export async function addJudge({
  tournamentId,
  userId
}: AddJudgeParams): Promise<JudgeRow> {
  return transaction(async (client) => {
    await ensureTournamentExists(client, tournamentId);
    const result = await client.query<JudgeRow>(
      `INSERT INTO tournament_judge (tournament_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING
       RETURNING tournament_id, user_id`,
      [tournamentId, userId]
    );
    const judge = result.rows[0];
    if (!judge) {
      throw new HttpError(409, 'Judge already assigned');
    }
    return judge;
  });
}

interface TournamentParticipant {
  id: string;
  userId: string;
  displayName: string;
  email: string;
}

export async function listTournamentParticipants(
  tournamentId: string
): Promise<TournamentParticipant[]> {
  const pool = getPool();
  const result = await pool.query<{
    id: string;
    user_id: string;
    display_name: string;
    email: string;
  }>(
    `SELECT tp.id, tp.user_id, u.display_name, u.email
     FROM tournament_participant tp
     JOIN app_user u ON u.id = tp.user_id
     WHERE tp.tournament_id = $1
     ORDER BY u.display_name`,
    [tournamentId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    email: row.email
  }));
}

interface TournamentJudge {
  userId: string;
  displayName: string;
  email: string;
}

export async function listTournamentJudges(tournamentId: string): Promise<TournamentJudge[]> {
  const pool = getPool();
  const result = await pool.query<{
    user_id: string;
    display_name: string;
    email: string;
  }>(
    `SELECT tj.user_id, u.display_name, u.email
     FROM tournament_judge tj
     JOIN app_user u ON u.id = tj.user_id
     WHERE tj.tournament_id = $1
     ORDER BY u.display_name`,
    [tournamentId]
  );
  return result.rows.map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    email: row.email
  }));
}

async function ensureTournamentExists(client: PoolClient, tournamentId: string): Promise<void> {
  const tournament = await client.query<{ id: string }>(
    'SELECT id FROM tournament WHERE id = $1',
    [tournamentId]
  );
  if (!tournament.rows[0]) {
    throw new HttpError(404, 'Tournament not found');
  }
}
