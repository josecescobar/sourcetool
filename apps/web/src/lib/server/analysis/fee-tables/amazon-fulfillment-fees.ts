interface SizeTierConfig {
  name: string;
  maxLength: number;
  maxWidth: number;
  maxHeight: number;
  maxWeight: number;
  baseFee: number;
  perLbOverFirst: number;
  firstWeightLb: number;
}

const SIZE_TIERS: SizeTierConfig[] = [
  { name: 'Small Standard', maxLength: 15, maxWidth: 12, maxHeight: 0.75, maxWeight: 1, baseFee: 3.22, perLbOverFirst: 0, firstWeightLb: 1 },
  { name: 'Large Standard', maxLength: 18, maxWidth: 14, maxHeight: 8, maxWeight: 20, baseFee: 3.86, perLbOverFirst: 0.08, firstWeightLb: 1 },
  { name: 'Small Oversize', maxLength: 60, maxWidth: 30, maxHeight: 30, maxWeight: 70, baseFee: 9.73, perLbOverFirst: 0.42, firstWeightLb: 2 },
  { name: 'Medium Oversize', maxLength: 108, maxWidth: 60, maxHeight: 60, maxWeight: 150, baseFee: 19.05, perLbOverFirst: 0.42, firstWeightLb: 2 },
  { name: 'Large Oversize', maxLength: 108, maxWidth: 108, maxHeight: 108, maxWeight: 150, baseFee: 89.98, perLbOverFirst: 0.83, firstWeightLb: 90 },
  { name: 'Special Oversize', maxLength: Infinity, maxWidth: Infinity, maxHeight: Infinity, maxWeight: Infinity, baseFee: 158.49, perLbOverFirst: 0.83, firstWeightLb: 90 },
];

export function getAmazonFulfillmentFee(dimensions: {
  lengthInches: number;
  widthInches: number;
  heightInches: number;
  weightPounds: number;
}): number {
  const { lengthInches, widthInches, heightInches, weightPounds } = dimensions;
  const sorted = [lengthInches, widthInches, heightInches].sort((a, b) => b - a);
  const longest = sorted[0]!;
  const median = sorted[1]!;
  const shortest = sorted[2]!;

  // Dimensional weight: (L x W x H) / 139
  const dimWeight = (longest * median * shortest) / 139;
  const billableWeight = Math.max(weightPounds, dimWeight);

  for (const tier of SIZE_TIERS) {
    if (longest <= tier.maxLength && median <= tier.maxWidth && shortest <= tier.maxHeight && billableWeight <= tier.maxWeight) {
      if (billableWeight <= tier.firstWeightLb) {
        return tier.baseFee;
      }
      const overWeight = billableWeight - tier.firstWeightLb;
      return tier.baseFee + Math.ceil(overWeight) * tier.perLbOverFirst;
    }
  }

  // Special oversize fallback
  const specialTier = SIZE_TIERS[SIZE_TIERS.length - 1]!;
  const overWeight = Math.max(0, billableWeight - specialTier.firstWeightLb);
  return specialTier.baseFee + Math.ceil(overWeight) * specialTier.perLbOverFirst;
}
