const poolQueryMock = jest.fn();

jest.mock('../../../src/db', () => ({
  getPool: () => ({
    query: poolQueryMock
  })
}));

describe('roundRubricService', () => {
  beforeEach(() => {
    poolQueryMock.mockReset();
  });

  it('normalizes keys when ensuring default criteria', async () => {
    const { ensureDefaultCriteriaForKeys } = await import(
      '../../../src/services/roundRubricService'
    );
    const queryMock = jest.fn();
    const client = {
      query: queryMock
    } as unknown as Parameters<typeof ensureDefaultCriteriaForKeys>[0];

    await ensureDefaultCriteriaForKeys(client, 'round-1', ['Flow Control', 'delivery']);

    expect(queryMock).toHaveBeenCalledTimes(1);
    const [, params] = queryMock.mock.calls[0];
    expect(params).toEqual([
      'round-1',
      ['flow control', 'delivery'],
      ['Flow Control', 'Delivery']
    ]);
  });

  it('maps numeric fields to numbers when listing criteria', async () => {
    poolQueryMock.mockResolvedValue({
      rows: [
        {
          id: 'crit-1',
          round_id: 'round-1',
          key: 'flow',
          name: 'Flow',
          weight: '1.50',
          min_value: '0',
          max_value: '100'
        }
      ]
    });
    const { listCriteriaByRound } = await import('../../../src/services/roundRubricService');
    const criteria = await listCriteriaByRound('round-1');
    expect(criteria).toEqual([
      {
        id: 'crit-1',
        roundId: 'round-1',
        key: 'flow',
        name: 'Flow',
        weight: 1.5,
        minValue: 0,
        maxValue: 100
      }
    ]);
  });
});
