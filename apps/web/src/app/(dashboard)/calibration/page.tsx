'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Crosshair, Target, TrendingDown, TrendingUp, Trophy } from 'lucide-react';
import type { CalibrationBias, CalibrationSegment } from '@sourcetool/shared';
import { useCalibration } from '@/hooks/useCalibration';

const BIAS_COPY: Record<
  CalibrationBias,
  { title: string; tone: string; accent: string; icon: React.ReactNode }
> = {
  OPTIMISTIC: {
    title: 'Your forecasts run optimistic',
    tone: 'text-amber-700',
    accent: 'border-amber-200 bg-amber-50',
    icon: <TrendingDown className="h-5 w-5 text-amber-600" />,
  },
  PESSIMISTIC: {
    title: 'You beat your own forecasts',
    tone: 'text-blue-700',
    accent: 'border-blue-200 bg-blue-50',
    icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
  },
  CALIBRATED: {
    title: 'Your forecasts are well calibrated',
    tone: 'text-green-700',
    accent: 'border-green-200 bg-green-50',
    icon: <Target className="h-5 w-5 text-green-600" />,
  },
  INSUFFICIENT_DATA: {
    title: 'Not enough resolved deals yet',
    tone: 'text-muted-foreground',
    accent: 'border-gray-200 bg-gray-50',
    icon: <Crosshair className="h-5 w-5 text-gray-500" />,
  },
};

function percentOfForecast(rate: number) {
  return `${Math.round(rate * 100)}%`;
}

function rateColor(rate: number) {
  if (rate >= 0.95) return 'text-green-600';
  if (rate >= 0.75) return 'text-amber-600';
  return 'text-red-600';
}

export default function CalibrationPage() {
  const { data, loading, error } = useCalibration();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading calibration...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    );
  }

  const hasHistory = !!data?.overall && data.sampleSize > 0;
  const bias = BIAS_COPY[data?.bias ?? 'INSUFFICIENT_DATA'];
  const overall = data?.overall;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Calibration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          How your forecasts compare to what you actually realized once units sold.
        </p>
      </div>

      {!hasHistory ? (
        <EmptyState unlinkedSoldCount={data?.unlinkedSoldCount ?? 0} />
      ) : (
        <>
          <div className={`rounded-xl border p-6 mb-6 ${bias.accent}`}>
            <div className="flex items-start gap-3">
              {bias.icon}
              <div>
                <h2 className={`font-semibold ${bias.tone}`}>{bias.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Across {overall!.sampleSize} resolved{' '}
                  {overall!.sampleSize === 1 ? 'deal' : 'deals'}, you realized an average{' '}
                  <strong>{overall!.realizedRoi}% ROI</strong> against a forecast of{' '}
                  <strong>{overall!.predictedRoi}%</strong> — that is{' '}
                  <strong className={rateColor(overall!.realizationRate)}>
                    {percentOfForecast(overall!.realizationRate)} of forecast
                  </strong>
                  . New deal scores are adjusted using this track record.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Resolved deals"
              value={String(overall!.sampleSize)}
              sub="Sold units linked to an analysis"
            />
            <StatCard
              label="Forecast vs realized ROI"
              value={`${overall!.predictedRoi}% → ${overall!.realizedRoi}%`}
              valueClass={rateColor(overall!.realizationRate)}
              sub={`${percentOfForecast(overall!.realizationRate)} of forecast`}
            />
            <StatCard
              label="Win rate"
              value={`${overall!.winRate}%`}
              valueClass={overall!.winRate >= 50 ? 'text-green-600' : 'text-amber-600'}
              sub="Deals that made money"
              icon={<Trophy className="h-4 w-4 text-amber-500" />}
            />
            <StatCard
              label="Median time to sell"
              value={
                overall!.medianDaysToSell !== null ? `${overall!.medianDaysToSell}d` : '—'
              }
              sub="Purchase to sale"
            />
          </div>

          {data!.byCategory.length > 0 && (
            <div className="rounded-xl border bg-white p-6 shadow-sm mb-6">
              <h2 className="font-medium mb-1">Forecast vs realized ROI by category</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Categories where the bars diverge are where your estimates need the most
                adjustment.
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={data!.byCategory.slice(0, 8).map((s) => ({
                    label: s.label,
                    Forecast: s.predictedRoi,
                    Realized: s.realizedRoi,
                  }))}
                  // Keep each forecast/realized pair visually welded together and
                  // the categories far apart, so it reads as five comparisons
                  // rather than ten unrelated bars.
                  barGap={2}
                  barCategoryGap="30%"
                  margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <Tooltip formatter={(value: number) => `${value}%`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Forecast" fill="#c7d2fe" radius={[4, 4, 0, 0]} maxBarSize={48} />
                  <Bar dataKey="Realized" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SegmentTable
              title="Does your deal score predict reality?"
              caption="Win rate by the AI score the deal received at decision time."
              segments={data!.byScoreBand}
              minSampleSize={data!.minSampleSize}
            />
            <SegmentTable
              title="Accuracy by category"
              caption="Where your sourcing estimates hold up, and where they do not."
              segments={data!.byCategory}
              minSampleSize={data!.minSampleSize}
            />
          </div>

          {data!.unlinkedSoldCount > 0 && (
            <p className="text-xs text-muted-foreground mt-6">
              {data!.unlinkedSoldCount} sold{' '}
              {data!.unlinkedSoldCount === 1 ? 'unit is' : 'units are'} not linked to an
              analysis and {data!.unlinkedSoldCount === 1 ? 'is' : 'are'} excluded. Run an
              analysis before recording a purchase to include it here.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({ unlinkedSoldCount }: { unlinkedSoldCount: number }) {
  return (
    <div className="rounded-xl border bg-white p-10 shadow-sm text-center">
      <Crosshair className="h-10 w-10 text-gray-300 mx-auto mb-4" />
      <h2 className="font-medium">No resolved deals yet</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
        Calibration compares what a deal was forecast to earn against what it actually
        earned. It needs sold units that are linked to the analysis behind the purchase.
      </p>
      <ol className="text-sm text-muted-foreground mt-4 inline-block text-left space-y-1">
        <li>1. Analyze a product to record the forecast.</li>
        <li>2. Record the purchase under Sourced.</li>
        <li>3. Mark it sold with the actual sale price and fees.</li>
      </ol>
      {unlinkedSoldCount > 0 && (
        <p className="text-xs text-muted-foreground mt-6">
          {unlinkedSoldCount} sold {unlinkedSoldCount === 1 ? 'unit has' : 'units have'} no
          linked analysis, so {unlinkedSoldCount === 1 ? 'it cannot' : 'they cannot'} be
          scored against a forecast.
        </p>
      )}
    </div>
  );
}

function SegmentTable({
  title,
  caption,
  segments,
  minSampleSize,
}: {
  title: string;
  caption: string;
  segments: CalibrationSegment[];
  minSampleSize: number;
}) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="font-medium mb-1">{title}</h2>
      <p className="text-xs text-muted-foreground mb-4">{caption}</p>
      {segments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nothing to show yet.</p>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">Segment</th>
                <th className="pb-2 font-medium text-right">Deals</th>
                <th className="pb-2 font-medium text-right">Win rate</th>
                <th className="pb-2 font-medium text-right">Of forecast</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((s) => {
                const thin = s.sampleSize < minSampleSize;
                return (
                  <tr key={s.key} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2">
                      <span className="truncate block max-w-[220px]">{s.label}</span>
                      {thin && (
                        <span className="text-xs text-muted-foreground">
                          too few to adjust scoring
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right text-muted-foreground">{s.sampleSize}</td>
                    <td className="py-2 text-right">{s.winRate}%</td>
                    <td
                      className={`py-2 text-right font-medium ${
                        thin ? 'text-muted-foreground' : rateColor(s.realizationRate)
                      }`}
                    >
                      {percentOfForecast(s.realizationRate)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClass,
  sub,
  icon,
}: {
  label: string;
  value: string;
  valueClass?: string;
  sub: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-bold mt-1 ${valueClass ?? ''}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}
