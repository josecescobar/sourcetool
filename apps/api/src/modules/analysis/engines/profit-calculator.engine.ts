import { Injectable } from '@nestjs/common';
import type { CalculateInput, ProfitResult, FeeBreakdown, ScenarioResult, BreakevenInput } from '@sourcetool/shared';
import { applyMathExpression } from '@sourcetool/shared';
import { AmazonFbaCalculator } from '../calculators/amazon-fba.calculator';
import { AmazonFbmCalculator } from '../calculators/amazon-fbm.calculator';
import { WalmartWfsCalculator } from '../calculators/walmart-wfs.calculator';
import { EbayCalculator } from '../calculators/ebay.calculator';

export interface IMarketplaceCalculator {
  calculateFees(input: {
    sellPrice: number;
    category?: string;
    dimensions?: { lengthInches: number; widthInches: number; heightInches: number; weightPounds: number };
    prepFee?: number;
    inboundShipping?: number;
    monthsInStorage?: number;
  }): FeeBreakdown;
}

@Injectable()
export class ProfitCalculatorEngine {
  private calculators: Record<string, IMarketplaceCalculator> = {
    FBA: new AmazonFbaCalculator(),
    FBM: new AmazonFbmCalculator(),
    WFS: new WalmartWfsCalculator(),
    WFM: new WalmartWfsCalculator(), // Simplified for now
    EBAY_MANAGED: new EbayCalculator(),
    EBAY_SELLER: new EbayCalculator(),
  };

  calculate(input: CalculateInput): ProfitResult {
    let buyPrice = input.buyPrice;
    if (input.buyPriceExpression) {
      buyPrice = applyMathExpression(buyPrice, input.buyPriceExpression);
    }

    const calculator = this.calculators[input.fulfillmentType];
    if (!calculator) {
      throw new Error(`Unsupported fulfillment type: ${input.fulfillmentType}`);
    }

    const fees = calculator.calculateFees({
      sellPrice: input.sellPrice,
      category: input.category,
      dimensions: input.dimensions,
      prepFee: input.prepFee,
      inboundShipping: input.inboundShipping,
      monthsInStorage: input.monthsInStorage,
    });

    const profit = input.sellPrice - buyPrice - fees.totalFees;
    const roi = buyPrice > 0 ? (profit / buyPrice) * 100 : 0;
    const margin = input.sellPrice > 0 ? (profit / input.sellPrice) * 100 : 0;
    const breakeven = this.calculateBreakeven(buyPrice, fees, input.sellPrice);

    return {
      buyPrice,
      sellPrice: input.sellPrice,
      fees,
      profit: Math.round(profit * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      margin: Math.round(margin * 100) / 100,
      breakeven: Math.round(breakeven * 100) / 100,
    };
  }

  calculateBreakevenPrice(input: BreakevenInput): number {
    const calculator = this.calculators[input.fulfillmentType];
    if (!calculator) throw new Error(`Unsupported: ${input.fulfillmentType}`);

    // Binary search for breakeven sell price
    let low = input.buyPrice;
    let high = input.buyPrice * 5;

    for (let i = 0; i < 50; i++) {
      const mid = (low + high) / 2;
      const fees = calculator.calculateFees({
        sellPrice: mid,
        category: input.category,
        dimensions: input.dimensions,
      });
      const profit = mid - input.buyPrice - fees.totalFees;

      if (Math.abs(profit) < 0.01) return Math.round(mid * 100) / 100;
      if (profit < 0) low = mid;
      else high = mid;
    }

    return Math.round(((low + high) / 2) * 100) / 100;
  }

  scenario(input: CalculateInput): ScenarioResult {
    const expected = this.calculate(input);
    const best = this.calculate({ ...input, sellPrice: input.sellPrice * 1.1 });
    const worst = this.calculate({ ...input, sellPrice: input.sellPrice * 0.85 });
    return { best, expected, worst };
  }

  private calculateBreakeven(buyPrice: number, fees: FeeBreakdown, sellPrice: number): number {
    // Approximate breakeven: buyPrice + fees (at current sell price level)
    const feeRatio = sellPrice > 0 ? fees.totalFees / sellPrice : 0.3;
    return buyPrice / (1 - feeRatio);
  }
}
