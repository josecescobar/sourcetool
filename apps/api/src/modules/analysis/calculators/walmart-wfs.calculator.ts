import type { FeeBreakdown } from '@sourcetool/shared';
import type { IMarketplaceCalculator } from '../engines/profit-calculator.engine';
import { WALMART_REFERRAL_FEES } from '../fee-tables/walmart-referral-fees';
import { getWalmartFulfillmentFee } from '../fee-tables/walmart-fulfillment-fees';

export class WalmartWfsCalculator implements IMarketplaceCalculator {
  calculateFees(input: {
    sellPrice: number;
    category?: string;
    dimensions?: { lengthInches: number; widthInches: number; heightInches: number; weightPounds: number };
    prepFee?: number;
    inboundShipping?: number;
  }): FeeBreakdown {
    const categoryKey = input.category || 'Default';
    const referralConfig = WALMART_REFERRAL_FEES[categoryKey] ?? WALMART_REFERRAL_FEES['Default']!;
    const referralFeePercent = referralConfig.percentage;
    const referralFee = input.sellPrice * (referralFeePercent / 100);

    const fulfillmentFee = input.dimensions
      ? getWalmartFulfillmentFee(input.dimensions)
      : 3.45;

    const storageFee = 0.75; // Walmart storage per cubic foot estimate
    const prepFee = input.prepFee || 0;
    const inboundShipping = input.inboundShipping || 0;
    const totalFees = referralFee + fulfillmentFee + storageFee + prepFee + inboundShipping;

    return {
      referralFee: Math.round(referralFee * 100) / 100,
      referralFeePercent,
      fulfillmentFee: Math.round(fulfillmentFee * 100) / 100,
      storageFee: Math.round(storageFee * 100) / 100,
      prepFee,
      inboundShipping,
      totalFees: Math.round(totalFees * 100) / 100,
    };
  }
}
