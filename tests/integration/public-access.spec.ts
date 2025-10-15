import request from 'supertest';

import { createApp } from '../../src/app';
import type { AppConfig } from '../../src/config/env';
import type { Match } from '../../src/services/matchService';
import type { Round } from '../../src/services/roundService';
import type { Submission } from '../../src/services/submissionService';
import type { Tournament } from '../../src/services/tournamentService';
import type { RoundRubricCriterion } from '../../src/services/roundRubricService';
import * as matchService from '../../src/services/matchService';
import * as roundService from '../../src/services/roundService';
import * as submissionService from '../../src/services/submissionService';
import * as tournamentService from '../../src/services/tournamentService';
import * as roundRubricService from '../../src/services/roundRubricService';

jest.mock('../../src/services/tournamentService', () => ({
  listTournaments: jest.fn(),
  createTournament: jest.fn(),
  setTournamentStatus: jest.fn(),
  addParticipant: jest.fn(),
  addJudge: jest.fn(),
  listTournamentParticipants: jest.fn(),
  listTournamentJudges: jest.fn(),
  getTournamentById: jest.fn()
}));

jest.mock('../../src/services/roundService', () => ({
  createRound: jest.fn(),
  listRoundsByTournament: jest.fn(),
  getRoundById: jest.fn()
}));

jest.mock('../../src/services/roundRubricService', () => ({
  listCriteriaByRound: jest.fn()
}));

jest.mock('../../src/services/matchService', () => ({
  addMatchParticipant: jest.fn(),
  createMatch: jest.fn(),
  createMatchTrack: jest.fn(),
  listMatchParticipants: jest.fn(),
  listMatchTracks: jest.fn(),
  listMatchesByRound: jest.fn(),
  getMatchById: jest.fn()
}));

jest.mock('../../src/services/submissionService', () => ({
  saveDraft: jest.fn(),
  submit: jest.fn(),
  listSubmissionsByRound: jest.fn()
}));

const config: AppConfig = {
  env: 'test',
  http: { port: 0 },
  security: {
    jwtSecret: '12345678901234567890123456789012',
    jwtExpiresIn: '1h'
  },
  hashing: {
    saltRounds: 12
  },
  db: {
    connectionString: 'postgres://localhost/test'
  }
};

function buildApp() {
  return createApp({ config });
}

const tournament: Tournament = {
  id: 'tour-1',
  title: 'Spring Jam',
  maxBracketSize: 128,
  status: 'active',
  createdAt: new Date('2024-01-01T00:00:00Z')
};

const round: Round = {
  id: 'round-1',
  tournamentId: tournament.id,
  kind: 'bracket',
  number: 1,
  scoring: 'rubric',
  rubricKeys: ['flow', 'lyrics'],
  createdAt: new Date('2024-01-02T00:00:00Z')
};

const publicSubmission: Submission = {
  id: 'sub-1',
  roundId: round.id,
  participantId: 'participant-1',
  audioId: 'audio-1',
  lyrics: 'Bars on bars',
  status: 'submitted',
  submittedAt: new Date('2024-01-03T00:00:00Z'),
  lockedByAdmin: false,
  createdAt: new Date('2024-01-02T12:00:00Z'),
  updatedAt: new Date('2024-01-03T00:00:00Z')
};

const draftSubmission: Submission = {
  ...publicSubmission,
  id: 'sub-2',
  status: 'draft'
};

const match: Match = {
  id: 'match-1',
  roundId: round.id,
  startsAt: new Date('2024-01-04T00:00:00Z')
};

const criterion: RoundRubricCriterion = {
  id: 'criterion-1',
  roundId: round.id,
  key: 'flow',
  name: 'Flow',
  weight: 1,
  minValue: 0,
  maxValue: 100
};

describe('Public read-only endpoints', () => {
  const listTournamentsMock = tournamentService
    .listTournaments as jest.MockedFunction<typeof tournamentService.listTournaments>;
  const getTournamentByIdMock = tournamentService
    .getTournamentById as jest.MockedFunction<typeof tournamentService.getTournamentById>;
  const listTournamentParticipantsMock = tournamentService
    .listTournamentParticipants as jest.MockedFunction<
    typeof tournamentService.listTournamentParticipants
  >;
  const listTournamentJudgesMock = tournamentService
    .listTournamentJudges as jest.MockedFunction<typeof tournamentService.listTournamentJudges>;
  const listRoundsByTournamentMock = roundService
    .listRoundsByTournament as jest.MockedFunction<typeof roundService.listRoundsByTournament>;
  const getRoundByIdMock = roundService
    .getRoundById as jest.MockedFunction<typeof roundService.getRoundById>;
  const listSubmissionsByRoundMock = submissionService
    .listSubmissionsByRound as jest.MockedFunction<typeof submissionService.listSubmissionsByRound>;
  const listMatchesByRoundMock = matchService
    .listMatchesByRound as jest.MockedFunction<typeof matchService.listMatchesByRound>;
  const getMatchByIdMock = matchService
    .getMatchById as jest.MockedFunction<typeof matchService.getMatchById>;
  const listCriteriaByRoundMock = roundRubricService
    .listCriteriaByRound as jest.MockedFunction<typeof roundRubricService.listCriteriaByRound>;

  beforeEach(() => {
    jest.clearAllMocks();
    listTournamentsMock.mockResolvedValue([tournament]);
    listTournamentParticipantsMock.mockResolvedValue([
      {
        id: 'tp-1',
        userId: 'user-1',
        displayName: 'MC Test',
        email: 'mc@example.com'
      }
    ]);
    listTournamentJudgesMock.mockResolvedValue([
      {
        userId: 'judge-1',
        displayName: 'Judge Test',
        email: 'judge@example.com'
      }
    ]);
    listRoundsByTournamentMock.mockResolvedValue([round]);
    getRoundByIdMock.mockResolvedValue(round);
    listSubmissionsByRoundMock.mockResolvedValue([publicSubmission, draftSubmission]);
    listMatchesByRoundMock.mockResolvedValue([match]);
    getMatchByIdMock.mockResolvedValue(match);
    listCriteriaByRoundMock.mockResolvedValue([criterion]);
    getTournamentByIdMock.mockImplementation(async (_id, options) => {
      if (options?.includeDrafts === false) {
        return tournament;
      }
      return tournament;
    });
  });

  it('returns tournaments to anonymous users', async () => {
    const response = await request(buildApp()).get('/api/tournaments').expect(200);
    expect(response.body.tournaments).toHaveLength(1);
    expect(listTournamentsMock).toHaveBeenCalledWith({ includeDrafts: false });
  });

  it('hides draft tournaments from anonymous users', async () => {
    getTournamentByIdMock.mockResolvedValueOnce(null);
    await request(buildApp()).get(`/api/tournaments/${tournament.id}`).expect(404);
    expect(getTournamentByIdMock).toHaveBeenCalledWith(tournament.id, { includeDrafts: false });
  });

  it('sanitizes private fields for public tournament view', async () => {
    const response = await request(buildApp())
      .get(`/api/tournaments/${tournament.id}`)
      .expect(200);
    expect(response.body.participants[0]).toEqual({
      id: 'tp-1',
      userId: 'user-1',
      displayName: 'MC Test'
    });
    expect(response.body.judges[0]).toEqual({
      userId: 'judge-1',
      displayName: 'Judge Test'
    });
  });

  it('lists rounds for a tournament', async () => {
    await request(buildApp()).get(`/api/tournaments/${tournament.id}/rounds`).expect(200);
    expect(listRoundsByTournamentMock).toHaveBeenCalledWith(tournament.id);
  });

  it('provides round details publicly', async () => {
    const response = await request(buildApp())
      .get(`/api/rounds/${round.id}`)
      .expect(200);
    expect(response.body.round.id).toBe(round.id);
  });

  it('lists round criteria publicly', async () => {
    const response = await request(buildApp())
      .get(`/api/rounds/${round.id}/criteria`)
      .expect(200);
    expect(response.body.criteria).toEqual([
      expect.objectContaining({ id: criterion.id, key: criterion.key })
    ]);
  });

  it('only returns published submissions to anonymous users', async () => {
    const response = await request(buildApp())
      .get(`/api/rounds/${round.id}/submissions`)
      .expect(200);
    expect(response.body.submissions).toHaveLength(1);
    expect(response.body.submissions[0].id).toBe(publicSubmission.id);
    expect(listSubmissionsByRoundMock).toHaveBeenCalledWith(round.id);
  });

  it('lets anonymous users view battles after resolving visibility', async () => {
    await request(buildApp()).get(`/api/rounds/${round.id}/battles`).expect(200);
    expect(listMatchesByRoundMock).toHaveBeenCalledWith(round.id);
  });

  it('returns an individual battle publicly', async () => {
    await request(buildApp()).get(`/api/battles/${match.id}`).expect(200);
    expect(getMatchByIdMock).toHaveBeenCalledWith(match.id);
  });
});
