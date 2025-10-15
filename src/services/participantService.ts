import { getPool } from '../db';

export interface TournamentParticipant {
  id: string;
  tournamentId: string;
  userId: string;
}

interface ParticipantRow {
  id: string;
  tournament_id: string;
  user_id: string;
}

export async function getParticipantById(id: string): Promise<TournamentParticipant | null> {
  const pool = getPool();
  const result = await pool.query<ParticipantRow>(
    `SELECT id, tournament_id, user_id
     FROM tournament_participant
     WHERE id = $1`,
    [id]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    userId: row.user_id
  };
}
