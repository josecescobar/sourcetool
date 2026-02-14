export function getAmazonStorageFee(
  dimensions: { lengthInches: number; widthInches: number; heightInches: number; weightPounds: number },
  months: number = 1,
): number {
  const cubicFeet = (dimensions.lengthInches * dimensions.widthInches * dimensions.heightInches) / 1728;

  // Standard-size monthly storage: $0.87/cu ft (Jan-Sep), $2.40/cu ft (Oct-Dec)
  // Oversize: $0.56/cu ft (Jan-Sep), $1.40/cu ft (Oct-Dec)
  const isOversize = dimensions.lengthInches > 18 || dimensions.widthInches > 14 ||
    dimensions.heightInches > 8 || dimensions.weightPounds > 20;

  const currentMonth = new Date().getMonth() + 1;
  const isPeakSeason = currentMonth >= 10 && currentMonth <= 12;

  let ratePerCubicFoot: number;
  if (isOversize) {
    ratePerCubicFoot = isPeakSeason ? 1.40 : 0.56;
  } else {
    ratePerCubicFoot = isPeakSeason ? 2.40 : 0.87;
  }

  return Math.round(cubicFeet * ratePerCubicFoot * months * 100) / 100;
}
