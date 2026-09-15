export function getWalmartFulfillmentFee(dimensions: {
  lengthInches: number;
  widthInches: number;
  heightInches: number;
  weightPounds: number;
}): number {
  const { weightPounds } = dimensions;
  const sorted = [dimensions.lengthInches, dimensions.widthInches, dimensions.heightInches].sort((a, b) => b - a);
  const longest = sorted[0]!;

  // WFS fee structure (simplified)
  if (weightPounds <= 1 && longest <= 15) return 3.45;
  if (weightPounds <= 2 && longest <= 18) return 4.95;
  if (weightPounds <= 5 && longest <= 18) return 5.45;
  if (weightPounds <= 10 && longest <= 18) return 6.95;
  if (weightPounds <= 20 && longest <= 18) return 8.95;
  if (weightPounds <= 30) return 12.95;
  if (weightPounds <= 50) return 18.95;
  if (weightPounds <= 70) return 24.95;

  // Over 70 lbs
  return 24.95 + Math.ceil((weightPounds - 70) / 10) * 5.00;
}
