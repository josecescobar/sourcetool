import { describe, expect, it } from 'vitest';
import type { CalculateInput } from '@sourcetool/shared';
import { ProfitCalculatorEngine } from './profit-calculator.engine';

const engine = new ProfitCalculatorEngine();

/** Standard-size unit so fulfillment/storage come from the real tables. */
const dimensions = {
  lengthInches: 9,
  widthInches: 6,
  heightInches: 2,
  weightPounds: 1,
};

function input(overrides: Partial<CalculateInput> = {}): CalculateInput {
  return {
    marketplace: 'AMAZON_US',
    fulfillmentType: 'FBA',
    buyPrice: 10,
    sellPrice: 30,
    category: 'Home & Kitchen',
    dimensions,
    ...overrides,
  } as CalculateInput;
}

describe('ProfitCalculatorEngine.calculate', () => {
  it('derives profit as sell price minus buy price minus every fee', () => {
    const result = engine.calculate(input());

    expect(result.profit).toBeCloseTo(
      result.sellPrice - result.buyPrice - result.fees.totalFees,
      2,
    );
  });

  it('totals the fee breakdown to the sum of its parts', () => {
    const { fees } = engine.calculate(input({ prepFee: 1.5, inboundShipping: 0.75 }));

    const summed =
      fees.referralFee +
      fees.fulfillmentFee +
      fees.storageFee +
      fees.prepFee +
      fees.inboundShipping;

    expect(fees.totalFees).toBeCloseTo(summed, 2);
  });

  it('computes ROI against buy price and margin against sell price', () => {
    const result = engine.calculate(input());

    expect(result.roi).toBeCloseTo((result.profit / result.buyPrice) * 100, 1);
    expect(result.margin).toBeCloseTo((result.profit / result.sellPrice) * 100, 1);
  });

  it('applies the category referral percentage', () => {
    // Home & Kitchen is 15%.
    const result = engine.calculate(input({ sellPrice: 100 }));

    expect(result.fees.referralFeePercent).toBe(15);
    expect(result.fees.referralFee).toBeCloseTo(15, 2);
  });

  it('falls back to the default referral rate for an unknown category', () => {
    const known = engine.calculate(input({ category: 'Home & Kitchen', sellPrice: 100 }));
    const unknown = engine.calculate(input({ category: 'Not A Real Category', sellPrice: 100 }));

    expect(unknown.fees.referralFeePercent).toBe(known.fees.referralFeePercent);
  });

  it('enforces the referral minimum fee on very cheap items', () => {
    // 15% of $1.00 is $0.15, below the $0.30 floor.
    const result = engine.calculate(input({ buyPrice: 0.5, sellPrice: 1 }));

    expect(result.fees.referralFee).toBeGreaterThanOrEqual(0.3);
  });

  it('reports a negative profit rather than clamping at zero', () => {
    const result = engine.calculate(input({ buyPrice: 40, sellPrice: 20 }));

    expect(result.profit).toBeLessThan(0);
    expect(result.roi).toBeLessThan(0);
  });

  it('does not divide by zero when the buy price is free', () => {
    const result = engine.calculate(input({ buyPrice: 0 }));

    expect(Number.isFinite(result.roi)).toBe(true);
    expect(result.roi).toBe(0);
  });

  it('rejects an unsupported fulfillment type instead of silently zeroing fees', () => {
    expect(() =>
      engine.calculate(input({ fulfillmentType: 'NOT_A_TYPE' as CalculateInput['fulfillmentType'] })),
    ).toThrow(/Unsupported fulfillment type/);
  });

  it('applies a buy price expression before calculating', () => {
    const plain = engine.calculate(input({ buyPrice: 10 }));
    const discounted = engine.calculate(input({ buyPrice: 10, buyPriceExpression: '-50%' }));

    expect(discounted.buyPrice).toBeLessThan(plain.buyPrice);
    expect(discounted.profit).toBeGreaterThan(plain.profit);
  });

  it('charges more storage the longer a unit sits', () => {
    const oneMonth = engine.calculate(input({ monthsInStorage: 1 }));
    const sixMonths = engine.calculate(input({ monthsInStorage: 6 }));

    expect(sixMonths.fees.storageFee).toBeGreaterThan(oneMonth.fees.storageFee);
    expect(sixMonths.profit).toBeLessThan(oneMonth.profit);
  });
});

describe('ProfitCalculatorEngine.calculateBreakevenPrice', () => {
  it('finds a sell price that lands near zero profit', () => {
    const buyPrice = 12;
    const breakeven = engine.calculateBreakevenPrice({
      marketplace: 'AMAZON_US',
      fulfillmentType: 'FBA',
      buyPrice,
      category: 'Home & Kitchen',
      dimensions,
    } as Parameters<typeof engine.calculateBreakevenPrice>[0]);

    const atBreakeven = engine.calculate(input({ buyPrice, sellPrice: breakeven }));

    expect(Math.abs(atBreakeven.profit)).toBeLessThan(0.5);
  });

  it('requires a sell price above the buy price to break even', () => {
    const buyPrice = 12;
    const breakeven = engine.calculateBreakevenPrice({
      marketplace: 'AMAZON_US',
      fulfillmentType: 'FBA',
      buyPrice,
      category: 'Home & Kitchen',
      dimensions,
    } as Parameters<typeof engine.calculateBreakevenPrice>[0]);

    expect(breakeven).toBeGreaterThan(buyPrice);
  });
});

describe('ProfitCalculatorEngine.scenario', () => {
  it('orders best, expected, and worst by profit', () => {
    const { best, expected, worst } = engine.scenario(input());

    expect(best.profit).toBeGreaterThan(expected.profit);
    expect(expected.profit).toBeGreaterThan(worst.profit);
  });
});
