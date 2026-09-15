import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '@sourcetool/db';
import { CalibrationService } from './calibration.service';

/**
 * Exercises the full loop against a real database: forecast -> purchase ->
 * sale -> calibration. The mocked unit tests cannot catch a bad Prisma filter
 * or a migration that links the wrong rows.
 *
 * Skipped when DATABASE_URL is absent so local runs without Postgres still pass.
 */
const describeIfDb = process.env.DATABASE_URL ? describe : describe.skip;

const service = new CalibrationService();
const SUFFIX = `calib-${Date.now()}`;

let teamId: string;
let userId: string;
let productId: string;
let otherTeamId: string;

async function makeAnalysis(opts: {
  team: string;
  product: string;
  roi: number;
  profit: number;
  aiScore?: number;
  createdAt?: Date;
  category?: string;
}) {
  return prisma.productAnalysis.create({
    data: {
      productId: opts.product,
      teamId: opts.team,
      userId,
      marketplace: 'AMAZON_US',
      fulfillmentType: 'FBA',
      buyPrice: 10,
      sellPrice: 30,
      referralFee: 4.5,
      fulfillmentFee: 3.22,
      storageFee: 0.1,
      totalFees: 7.82,
      profit: opts.profit,
      roi: opts.roi,
      margin: 30,
      breakeven: 20,
      aiScore: opts.aiScore,
      aiVerdict: opts.aiScore && opts.aiScore >= 80 ? 'STRONG_BUY' : 'BUY',
      snapshot: { category: opts.category ?? 'Toys & Games', bsr: 12000 },
      ...(opts.createdAt ? { createdAt: opts.createdAt } : {}),
    },
  });
}

async function makeSale(opts: {
  team: string;
  product: string;
  analysisId?: string | null;
  quantity: number;
  purchasePrice: number;
  actualProfit: number;
  actualRoi: number;
  purchaseDate: Date;
  soldDate: Date | null;
}) {
  return prisma.sourcedProduct.create({
    data: {
      teamId: opts.team,
      productId: opts.product,
      analysisId: opts.analysisId ?? null,
      marketplace: 'AMAZON_US',
      purchaseDate: opts.purchaseDate,
      purchasePrice: opts.purchasePrice,
      quantity: opts.quantity,
      soldDate: opts.soldDate,
      soldPrice: opts.soldDate ? 30 : null,
      actualProfit: opts.soldDate ? opts.actualProfit : null,
      actualRoi: opts.soldDate ? opts.actualRoi : null,
    },
  });
}

describeIfDb('calibration end to end', () => {
  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email: `${SUFFIX}@example.com`, name: 'Calib Tester' },
    });
    userId = user.id;

    const team = await prisma.team.create({
      data: { name: `Team ${SUFFIX}`, ownerId: userId },
    });
    teamId = team.id;

    const other = await prisma.team.create({
      data: { name: `Other ${SUFFIX}`, ownerId: userId },
    });
    otherTeamId = other.id;

    const product = await prisma.product.create({
      data: { asin: `B${SUFFIX}`.slice(0, 20), title: 'Test Widget', category: 'Toys & Games' },
    });
    productId = product.id;
  });

  afterAll(async () => {
    await prisma.sourcedProduct.deleteMany({ where: { teamId: { in: [teamId, otherTeamId] } } });
    await prisma.productAnalysis.deleteMany({ where: { teamId: { in: [teamId, otherTeamId] } } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.team.deleteMany({ where: { id: { in: [teamId, otherTeamId] } } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  it('starts with no track record', async () => {
    const report = await service.getReport(teamId);

    expect(report.sampleSize).toBe(0);
    expect(report.bias).toBe('INSUFFICIENT_DATA');
  });

  it('detects an optimistic seller once deals resolve', async () => {
    // Six deals forecast at 80% ROI that each realized 40%.
    for (let i = 0; i < 6; i++) {
      const analysis = await makeAnalysis({
        team: teamId,
        product: productId,
        roi: 80,
        profit: 20,
        aiScore: 85,
      });
      await makeSale({
        team: teamId,
        product: productId,
        analysisId: analysis.id,
        quantity: 1,
        purchasePrice: 10,
        actualProfit: 10,
        actualRoi: 40,
        purchaseDate: new Date('2026-01-01'),
        soldDate: new Date('2026-01-21'),
      });
    }

    const report = await service.getReport(teamId);

    expect(report.sampleSize).toBe(6);
    expect(report.bias).toBe('OPTIMISTIC');
    expect(report.overall!.realizationRate).toBeCloseTo(0.5, 2);
    expect(report.overall!.medianDaysToSell).toBe(20);
    expect(report.overall!.winRate).toBe(100);
  });

  it('adjusts a new forecast down by the realized rate', async () => {
    const calibrated = await service.calibrateForecast(teamId, {
      predictedRoi: 100,
      predictedProfit: 25,
      category: 'Toys & Games',
      aiScore: 85,
    });

    expect(calibrated.applied).toBe(true);
    expect(calibrated.calibratedRoi).toBeCloseTo(50, 0);
    expect(calibrated.calibratedProfit).toBeCloseTo(12.5, 1);
  });

  it('produces a prompt brief describing the track record', async () => {
    const brief = await service.getCalibrationBrief(teamId, { category: 'Toys & Games' });

    expect(brief).toMatch(/OPTIMISTIC/);
    expect(brief).toMatch(/Toys & Games specifically/);
  });

  it('normalises a multi-unit lot to per-unit profit', async () => {
    const analysis = await makeAnalysis({
      team: teamId,
      product: productId,
      roi: 80,
      profit: 20,
      aiScore: 85,
    });
    await makeSale({
      team: teamId,
      product: productId,
      analysisId: analysis.id,
      quantity: 10,
      purchasePrice: 10,
      actualProfit: 100, // $10/unit
      actualRoi: 40,
      purchaseDate: new Date('2026-02-01'),
      soldDate: new Date('2026-02-21'),
    });

    const outcomes = await service.getResolvedOutcomes(teamId);
    const lot = outcomes.find((o) => o.realizedProfit === 10 && o.predictedProfit === 20);

    expect(lot).toBeDefined();
  });

  it('excludes unsold inventory from the sample', async () => {
    const before = (await service.getReport(teamId)).sampleSize;

    const analysis = await makeAnalysis({
      team: teamId,
      product: productId,
      roi: 80,
      profit: 20,
    });
    await makeSale({
      team: teamId,
      product: productId,
      analysisId: analysis.id,
      quantity: 1,
      purchasePrice: 10,
      actualProfit: 0,
      actualRoi: 0,
      purchaseDate: new Date('2026-03-01'),
      soldDate: null,
    });

    expect((await service.getReport(teamId)).sampleSize).toBe(before);
  });

  it('counts sold units with no linked analysis as unlinked', async () => {
    await makeSale({
      team: teamId,
      product: productId,
      analysisId: null,
      quantity: 1,
      purchasePrice: 10,
      actualProfit: 5,
      actualRoi: 20,
      purchaseDate: new Date('2026-04-01'),
      soldDate: new Date('2026-04-15'),
    });

    const report = await service.getReport(teamId);

    expect(report.unlinkedSoldCount).toBeGreaterThan(0);
  });

  it('never mixes another team\'s outcomes into the sample', async () => {
    const analysis = await makeAnalysis({
      team: otherTeamId,
      product: productId,
      roi: 20,
      profit: 5,
      aiScore: 30,
    });
    await makeSale({
      team: otherTeamId,
      product: productId,
      analysisId: analysis.id,
      quantity: 1,
      purchasePrice: 10,
      actualProfit: 40,
      actualRoi: 400,
      purchaseDate: new Date('2026-01-01'),
      soldDate: new Date('2026-01-10'),
    });

    const mine = await service.getReport(teamId);
    const theirs = await service.getReport(otherTeamId);

    // An outlier on the other team must not move this team's numbers.
    expect(mine.overall!.realizationRate).toBeCloseTo(0.5, 1);
    expect(theirs.sampleSize).toBe(1);
  });

  it('links a purchase to the analysis that preceded it', async () => {
    const older = await makeAnalysis({
      team: teamId,
      product: productId,
      roi: 10,
      profit: 2,
      createdAt: new Date('2026-05-01'),
    });
    const newer = await makeAnalysis({
      team: teamId,
      product: productId,
      roi: 90,
      profit: 22,
      createdAt: new Date('2026-05-10'),
    });

    const linked = await service.findLikelyAnalysisId(
      teamId,
      productId,
      new Date('2026-05-12'),
    );

    expect(linked).toBe(newer.id);
    expect(linked).not.toBe(older.id);
  });

  it('does not link a purchase to an analysis run long after it', async () => {
    const isolatedProduct = await prisma.product.create({
      data: { asin: `X${SUFFIX}`.slice(0, 20), title: 'Later Analysis Widget' },
    });

    await makeAnalysis({
      team: teamId,
      product: isolatedProduct.id,
      roi: 90,
      profit: 22,
      createdAt: new Date('2026-06-20'),
    });

    const linked = await service.findLikelyAnalysisId(
      teamId,
      isolatedProduct.id,
      new Date('2026-06-01'),
    );

    expect(linked).toBeNull();

    await prisma.productAnalysis.deleteMany({ where: { productId: isolatedProduct.id } });
    await prisma.product.delete({ where: { id: isolatedProduct.id } });
  });
});
