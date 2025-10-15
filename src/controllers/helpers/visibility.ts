import { HttpError } from '../../middleware/errorHandler';
import {
  getTournamentById,
  type Tournament
} from '../../services/tournamentService';
import { getRoundById, type Round } from '../../services/roundService';
import type { User } from '../../services/userService';
import { isStaff } from '../../utils/access';

export async function ensureTournamentVisible(
  tournamentId: string,
  user?: User
): Promise<Tournament> {
  const includeDrafts = isStaff(user);
  const tournament = await getTournamentById(tournamentId, { includeDrafts });
  if (!tournament) {
    throw new HttpError(404, 'Tournament not found');
  }
  return tournament;
}

export async function ensureRoundVisible(roundId: string, user?: User): Promise<Round> {
  const round = await getRoundById(roundId);
  if (!round) {
    throw new HttpError(404, 'Round not found');
  }
  await ensureTournamentVisible(round.tournamentId, user);
  return round;
}
