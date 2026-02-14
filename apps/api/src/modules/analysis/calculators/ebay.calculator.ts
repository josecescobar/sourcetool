import type { FeeBreakdown } from '@sourcetool/shared';
import type { IMarketplaceCalculator } from '../engines/profit-calculator.engine';
import { EBAY_FINAL_VALUE_FEES } from '../fee-tables/ebay-final-value-fees';

export class EbayCalculator implements IMarketplaceCalculator {
  calculateFees(input: {
    sellPrice: number;
    category?: string;
  }): FeeBreakdown {
    const categoryKey = input.category || 'Default';
    const feeConfig = EBAY_FINAL_VALUE_FEES[categoryKey] || EBAY_FINAL_VALUE_FEES['Default'];
    const referralFeePercent = feeConfig.percentage;
    const referralFee = input.sellPrice * (referralFeePercent / 100);

    // Payment processing: 2.35% + $0.25 for managed payments
    const paymentProcessingFee = input.sellPrice * 0.0235 + 0.25;

    const totalFees = referralFee + paymentProcessingFee;

    return {
      referralFee: Math.round(referralFee * 100) / 100,
      referralFeePercent,
      fulfillmentFee: 0,
      storageFee: 0,
      prepFee: 0,
      inboundShipping: 0,
      paymentProcessingFee: Math.round(paymentProcessingFee * 100) / 100,
      totalFees: Math.round(totalFees * 100) / 100,
    };
  }
}
