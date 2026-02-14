import type { FeeBreakdown } from '@sourcetool/shared';
import type { IMarketplaceCalculator } from '../engines/profit-calculator.engine';
import { AMAZON_REFERRAL_FEES } from '../fee-tables/amazon-referral-fees';

export class AmazonFbmCalculator implements IMarketplaceCalculator {
  calculateFees(input: {
    sellPrice: number;
    category?: string;
    dimensions?: { lengthInches: number; widthInches: number; heightInches: number; weightPounds: number };
    prepFee?: number;
    inboundShipping?: number;
  }): FeeBreakdown {
    const categoryKey = input.category || 'Default';
    const referralConfig = AMAZON_REFERRAL_FEES[categoryKey] || AMAZON_REFERRAL_FEES['Default'];
    const referralFeePercent = referralConfig.percentage;
    const referralFeeCalc = input.sellPrice * (referralFeePercent / 100);
    const referralFee = Math.max(referralFeeCalc, referralConfig.minimumFee);

    // FBM: no fulfillment or storage fees from Amazon
    // Seller handles shipping — estimated or provided
    const inboundShipping = input.inboundShipping || 0;

    const totalFees = referralFee + inboundShipping;

    return {
      referralFee: Math.round(referralFee * 100) / 100,
      referralFeePercent,
      fulfillmentFee: 0,
      storageFee: 0,
      prepFee: 0,
      inboundShipping,
      totalFees: Math.round(totalFees * 100) / 100,
    };
  }
}
