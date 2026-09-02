import type { FeeBreakdown } from '@sourcetool/shared';
import type { IMarketplaceCalculator } from '../engines/profit-calculator.engine';
import { AMAZON_REFERRAL_FEES } from '../fee-tables/amazon-referral-fees';
import { getAmazonFulfillmentFee } from '../fee-tables/amazon-fulfillment-fees';
import { getAmazonStorageFee } from '../fee-tables/amazon-storage-fees';

export class AmazonFbaCalculator implements IMarketplaceCalculator {
  calculateFees(input: {
    sellPrice: number;
    category?: string;
    dimensions?: { lengthInches: number; widthInches: number; heightInches: number; weightPounds: number };
    prepFee?: number;
    inboundShipping?: number;
    monthsInStorage?: number;
  }): FeeBreakdown {
    // Referral fee
    const categoryKey = input.category || 'Default';
    const referralConfig = AMAZON_REFERRAL_FEES[categoryKey] ?? AMAZON_REFERRAL_FEES['Default']!;
    const referralFeePercent = referralConfig.percentage;
    const referralFeeCalc = input.sellPrice * (referralFeePercent / 100);
    const referralFee = Math.max(referralFeeCalc, referralConfig.minimumFee);

    // Fulfillment fee
    const fulfillmentFee = input.dimensions
      ? getAmazonFulfillmentFee(input.dimensions)
      : 3.22; // Default small standard

    // Storage fee
    const storageFee = input.dimensions
      ? getAmazonStorageFee(input.dimensions, input.monthsInStorage || 1)
      : 0.10; // Default estimate

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
