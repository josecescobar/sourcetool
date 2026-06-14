import React from 'react';

export type Tone = 'good' | 'bad' | 'warn' | 'neutral';

const toneClass: Record<Tone, string> = {
  good: 'text-green-600',
  bad: 'text-red-600',
  warn: 'text-yellow-600',
  neutral: 'text-foreground',
};

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: Tone;
}

/** Small labelled metric tile used across the analysis panels. */
export function StatTile({ label, value, sub, tone = 'neutral' }: StatTileProps) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-bold leading-tight ${toneClass[tone]}`}>{value}</div>
      {sub != null && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

/** Section wrapper with a title, matching the dashboard card style. */
export function Panel({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-white shadow-sm">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {right}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
