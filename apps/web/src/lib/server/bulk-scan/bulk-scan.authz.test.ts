import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Regression tests for the cross-team access hole: scan ids alone used to be
 * enough to read, delete, or retry another team's bulk scan.
 */

const bulkScan = {
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  delete: vi.fn(),
  update: vi.fn(),
};
const bulkScanRow = {
  findMany: vi.fn(),
  count: vi.fn(),
  updateMany: vi.fn(),
  update: vi.fn(),
};

vi.mock('@sourcetool/db', () => ({
  prisma: {
    bulkScan,
    bulkScanRow,
  },
}));

const { BulkScanService } = await import('./bulk-scan.service');

const OWNER_TEAM = 'team-owner';
const ATTACKER_TEAM = 'team-attacker';
const SCAN_ID = 'scan-123';

function makeService() {
  return new BulkScanService(
    {} as never,
    {} as never,
    {} as never,
  );
}

/** Mirrors Prisma: a teamId that doesn't match the row yields no result. */
function scanOwnedBy(teamId: string) {
  return ({ where }: { where: { id: string; teamId: string } }) =>
    Promise.resolve(
      where.id === SCAN_ID && where.teamId === teamId
        ? { id: SCAN_ID, teamId, status: 'COMPLETED', startedAt: null }
        : null,
    );
}

beforeEach(() => {
  vi.clearAllMocks();
  bulkScan.findFirst.mockImplementation(scanOwnedBy(OWNER_TEAM));
});

describe('BulkScanService cross-team access', () => {
  it('returns a scan to its owning team', async () => {
    await expect(makeService().getById(SCAN_ID, OWNER_TEAM)).resolves.toMatchObject({
      id: SCAN_ID,
      teamId: OWNER_TEAM,
    });
  });

  it('refuses to read another team\'s scan', async () => {
    await expect(makeService().getById(SCAN_ID, ATTACKER_TEAM)).rejects.toThrow(
      /Bulk scan not found/,
    );
  });

  it('refuses to list results for another team\'s scan', async () => {
    await expect(makeService().getResults(SCAN_ID, ATTACKER_TEAM)).rejects.toThrow(
      /Bulk scan not found/,
    );
    expect(bulkScanRow.findMany).not.toHaveBeenCalled();
  });

  it('refuses to delete another team\'s scan', async () => {
    await expect(makeService().delete(SCAN_ID, ATTACKER_TEAM)).rejects.toThrow(
      /Bulk scan not found/,
    );
    expect(bulkScan.delete).not.toHaveBeenCalled();
  });

  it('refuses to retry another team\'s scan', async () => {
    await expect(
      makeService().retryFailed(SCAN_ID, ATTACKER_TEAM, 'user-1'),
    ).rejects.toThrow(/Bulk scan not found/);
    expect(bulkScanRow.updateMany).not.toHaveBeenCalled();
  });

  it('does not process a chunk for a mismatched team', async () => {
    const result = await makeService().processChunk(SCAN_ID, ATTACKER_TEAM, 'user-1');

    expect(result).toEqual({ processed: 0, remaining: 0, done: true });
    expect(bulkScan.update).not.toHaveBeenCalled();
  });

  it('scopes every ownership lookup by teamId', async () => {
    await makeService().getById(SCAN_ID, OWNER_TEAM);

    expect(bulkScan.findFirst).toHaveBeenCalledWith({
      where: { id: SCAN_ID, teamId: OWNER_TEAM },
    });
  });
});
