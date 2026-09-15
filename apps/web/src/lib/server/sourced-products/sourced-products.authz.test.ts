import { beforeEach, describe, expect, it, vi } from 'vitest';

const sourcedProduct = { create: vi.fn() };
const productAnalysis = { findFirst: vi.fn() };

vi.mock('@sourcetool/db', () => ({
  prisma: { sourcedProduct, productAnalysis },
}));

const findLikelyAnalysisId = vi.fn();

const { SourcedProductsService } = await import('./sourced-products.service');

const TEAM = 'team-owner';
const PRODUCT = 'product-1';

function makeService() {
  return new SourcedProductsService({ findLikelyAnalysisId } as never);
}

const input = {
  productId: PRODUCT,
  marketplace: 'AMAZON_US' as const,
  purchaseDate: '2026-03-01',
  purchasePrice: 10,
  quantity: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  sourcedProduct.create.mockResolvedValue({ id: 'sp-1' });
});

describe('SourcedProductsService.create analysis link', () => {
  it('rejects an analysis that belongs to another team', async () => {
    productAnalysis.findFirst.mockResolvedValue(null);

    await expect(
      makeService().create(TEAM, { ...input, analysisId: 'someone-elses-analysis' }),
    ).rejects.toThrow(/not found for this team and product/);

    expect(sourcedProduct.create).not.toHaveBeenCalled();
    expect(productAnalysis.findFirst).toHaveBeenCalledWith({
      where: { id: 'someone-elses-analysis', teamId: TEAM, productId: PRODUCT },
      select: { id: true },
    });
  });

  it('rejects an analysis for a different product on the same team', async () => {
    productAnalysis.findFirst.mockResolvedValue(null);

    await expect(
      makeService().create(TEAM, { ...input, analysisId: 'wrong-product-analysis' }),
    ).rejects.toThrow(/not found for this team and product/);
  });

  it('accepts an analysis that matches team and product', async () => {
    productAnalysis.findFirst.mockResolvedValue({ id: 'analysis-ok' });

    await makeService().create(TEAM, { ...input, analysisId: 'analysis-ok' });

    expect(sourcedProduct.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ analysisId: 'analysis-ok', teamId: TEAM }),
      }),
    );
  });

  it('infers a link when the caller omits analysisId', async () => {
    findLikelyAnalysisId.mockResolvedValue('inferred-9');

    await makeService().create(TEAM, input);

    expect(findLikelyAnalysisId).toHaveBeenCalled();
    expect(productAnalysis.findFirst).not.toHaveBeenCalled();
    expect(sourcedProduct.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ analysisId: 'inferred-9' }),
      }),
    );
  });
});
