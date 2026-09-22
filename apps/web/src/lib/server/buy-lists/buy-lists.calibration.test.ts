import { beforeEach, describe, expect, it, vi } from 'vitest';

const buyList = { findFirst: vi.fn() };

vi.mock('@sourcetool/db', () => ({
  prisma: { buyList },
}));

const { BuyListsService } = await import('./buy-lists.service');

const TEAM = 'team-1';
const LIST = 'list-1';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('BuyListsService.getById calibration', () => {
  it('decorates items from one team summary', async () => {
    buyList.findFirst.mockResolvedValue({
      id: LIST,
      teamId: TEAM,
      items: [
        { id: 'i1', analysis: { roi: 40, profit: 8, snapshot: {} }, product: { category: 'Toys & Games' } },
        { id: 'i2', analysis: null, product: {} },
      ],
    });

    const decorateAnalyses = vi.fn(async (_team: string, rows: unknown[]) =>
      (rows as Array<{ analysis: unknown }>).map((row) =>
        row.analysis ? { ...row, calibrated: { applied: true, calibratedRoi: 12 } } : row,
      ),
    );

    const list = await new BuyListsService({ decorateAnalyses } as never).getById(LIST, TEAM);
    const items = list.items as Array<{ calibrated?: { applied?: boolean } }>;

    expect(decorateAnalyses).toHaveBeenCalledTimes(1);
    expect(decorateAnalyses).toHaveBeenCalledWith(TEAM, expect.any(Array));
    expect(items[0]?.calibrated?.applied).toBe(true);
    expect(items[1]?.calibrated).toBeUndefined();
  });

  it('returns the list unchanged when no calibration service is wired', async () => {
    const raw = { id: LIST, teamId: TEAM, items: [] };
    buyList.findFirst.mockResolvedValue(raw);

    await expect(new BuyListsService().getById(LIST, TEAM)).resolves.toEqual(raw);
  });
});
