import { beforeEach, describe, expect, it, vi } from 'vitest';

const subscription = { findUnique: vi.fn() };
const usageRecord = { findUnique: vi.fn(), upsert: vi.fn() };
const teamMember = { findUnique: vi.fn(), count: vi.fn() };

vi.mock('@sourcetool/db', () => ({
  prisma: { subscription, usageRecord, teamMember },
}));

const { enforceBulkScanRowLimit, enforcePlanLimit, planAllowsAi } = await import('./guards');

const TEAM = 'team-1';

function onPlan(planTier: string) {
  subscription.findUnique.mockResolvedValue({ teamId: TEAM, planTier });
}

beforeEach(() => {
  vi.clearAllMocks();
  usageRecord.upsert.mockResolvedValue({});
});

describe('enforceBulkScanRowLimit', () => {
  it('rejects an upload larger than the plan allows', async () => {
    onPlan('STARTER'); // 500 rows

    await expect(enforceBulkScanRowLimit(TEAM, 501)).rejects.toMatchObject({
      body: { feature: 'bulk_scan_rows', limit: 500, current: 501 },
    });
  });

  it('allows an upload exactly at the limit', async () => {
    onPlan('STARTER');

    await expect(enforceBulkScanRowLimit(TEAM, 500)).resolves.toBeUndefined();
  });

  it('never blocks an unlimited plan', async () => {
    onPlan('ENTERPRISE');

    await expect(enforceBulkScanRowLimit(TEAM, 1_000_000)).resolves.toBeUndefined();
  });

  it('treats a team with no subscription as FREE', async () => {
    subscription.findUnique.mockResolvedValue(null);

    // FREE allows 0 bulk scan rows.
    await expect(enforceBulkScanRowLimit(TEAM, 1)).rejects.toMatchObject({
      body: { feature: 'bulk_scan_rows', limit: 0 },
    });
  });

  it('is a no-op without a team', async () => {
    await expect(enforceBulkScanRowLimit(undefined, 10_000)).resolves.toBeUndefined();
    expect(subscription.findUnique).not.toHaveBeenCalled();
  });
});

describe('export gating matches the advertised plans', () => {
  it('allows CSV export on Starter, which markets it', async () => {
    onPlan('STARTER');

    await expect(enforcePlanLimit(TEAM, 'export_csv')).resolves.toBeUndefined();
  });

  it('still blocks CSV export on Free', async () => {
    onPlan('FREE');

    await expect(enforcePlanLimit(TEAM, 'export_csv')).rejects.toMatchObject({
      body: { feature: 'export_csv' },
    });
  });

  it('keeps Google Sheets export on Pro and above', async () => {
    onPlan('STARTER');
    await expect(enforcePlanLimit(TEAM, 'export')).rejects.toMatchObject({
      body: { feature: 'export' },
    });

    onPlan('PROFESSIONAL');
    await expect(enforcePlanLimit(TEAM, 'export')).resolves.toBeUndefined();
  });
});

describe('planAllowsAi', () => {
  it('is false on plans without AI entitlement', async () => {
    onPlan('STARTER');

    await expect(planAllowsAi(TEAM)).resolves.toBe(false);
  });

  it('is true on Pro', async () => {
    onPlan('PROFESSIONAL');

    await expect(planAllowsAi(TEAM)).resolves.toBe(true);
  });

  it('is false without a team rather than throwing', async () => {
    await expect(planAllowsAi(undefined)).resolves.toBe(false);
  });
});
