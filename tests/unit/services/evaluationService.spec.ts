import { HttpError } from '../../../src/middleware/errorHandler';

const poolQueryMock = jest.fn();
const listCriteriaByRoundMock = jest.fn();

jest.mock('../../../src/db', () => ({
  getPool: () => ({
    query: poolQueryMock
  })
}));

jest.mock('../../../src/services/roundRubricService', () => ({
  listCriteriaByRound: listCriteriaByRoundMock
}));

describe('evaluationService.evaluateMatch', () => {
  const baseMatchRow = {
    id: 'match-1',
    round_id: 'round-1',
    scoring: 'rubric'
  };
  const criterion = {
    id: 'criterion-1',
    roundId: 'round-1',
    key: 'flow',
    name: 'Flow',
    weight: 1,
    minValue: 0,
    maxValue: 100
  };

  beforeEach(() => {
    jest.resetModules();
    poolQueryMock.mockReset();
    listCriteriaByRoundMock.mockReset();
  });

  it('accepts rubric values within configured bounds', async () => {
    poolQueryMock
      .mockResolvedValueOnce({ rows: [baseMatchRow] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'eval-1',
            judge_id: 'judge-1',
            target_type: 'match',
            target_id: 'match-1',
            round_id: 'round-1',
            pass: null,
            score: null,
            rubric: { flow: 90 },
            total_score: 90,
            comment: null,
            created_at: new Date('2024-05-01T00:00:00Z')
          }
        ]
      });
    listCriteriaByRoundMock.mockResolvedValue([criterion]);

    const { evaluateMatch } = await import('../../../src/services/evaluationService');
    const evaluation = await evaluateMatch({
      judgeId: 'judge-1',
      matchId: 'match-1',
      rubric: { flow: 90 },
      comment: null
    });

    expect(poolQueryMock).toHaveBeenCalledTimes(2);
    expect(listCriteriaByRoundMock).toHaveBeenCalledWith('round-1');
    expect(evaluation.totalScore).toBe(90);
    expect(evaluation.rubric).toEqual({ flow: 90 });
  });

  it('rejects rubric values above the allowed maximum', async () => {
    poolQueryMock.mockResolvedValueOnce({ rows: [baseMatchRow] });
    listCriteriaByRoundMock.mockResolvedValue([criterion]);
    const { evaluateMatch } = await import('../../../src/services/evaluationService');

    await expect(
      evaluateMatch({
        judgeId: 'judge-1',
        matchId: 'match-1',
        rubric: { flow: 101 }
      })
    ).rejects.toMatchObject({ status: 422 });

    expect(poolQueryMock).toHaveBeenCalledTimes(1);
  });
});
