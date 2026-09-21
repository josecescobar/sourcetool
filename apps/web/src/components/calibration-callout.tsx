import { Crosshair } from 'lucide-react';
import type { CalibratedForecast } from '@sourcetool/shared';

/**
 * Decision-time adjustment. Hidden until the team has enough sold history
 * for applyCalibration to actually change the number.
 */
export function CalibrationCallout({ forecast }: { forecast?: CalibratedForecast | null }) {
  if (!forecast?.applied) return null;

  const haircut = forecast.realizationRate < 1;
  const accent = haircut
    ? 'border-amber-200 bg-amber-50'
    : forecast.realizationRate > 1
      ? 'border-blue-200 bg-blue-50'
      : 'border-green-200 bg-green-50';
  const tone = haircut ? 'text-amber-800' : forecast.realizationRate > 1 ? 'text-blue-800' : 'text-green-800';
  const valueTone = haircut ? 'text-amber-700' : forecast.realizationRate > 1 ? 'text-blue-700' : 'text-green-700';

  return (
    <div className={`mt-4 rounded-lg border p-3 ${accent}`}>
      <div className="flex items-start gap-2">
        <Crosshair className={`h-4 w-4 mt-0.5 flex-shrink-0 ${tone}`} />
        <div className="min-w-0">
          <div className={`text-xs font-medium uppercase tracking-wide ${tone}`}>
            Calibrated to your track record
          </div>
          <p className="text-sm mt-1">
            Raw forecast{' '}
            <span className="font-medium">{forecast.predictedRoi.toFixed(1)}% ROI</span>
            {' / '}
            <span className="font-medium">${forecast.predictedProfit.toFixed(2)}</span>
            {' → expected '}
            <span className={`font-semibold ${valueTone}`}>
              {forecast.calibratedRoi.toFixed(1)}% ROI
            </span>
            {' / '}
            <span className={`font-semibold ${valueTone}`}>
              ${forecast.calibratedProfit.toFixed(2)}
            </span>
            .
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round(forecast.realizationRate * 100)}% of forecast based on {forecast.sampleSize}{' '}
            sold {forecast.sampleSize === 1 ? 'deal' : 'deals'} in {forecast.basis}.
          </p>
        </div>
      </div>
    </div>
  );
}
