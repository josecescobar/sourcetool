'use client';

export default function PerformancePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Performance Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Sourced', value: '0', sub: 'Products' },
          { label: 'Total Invested', value: '$0', sub: 'This month' },
          { label: 'Total Profit', value: '$0', sub: 'This month' },
          { label: 'Avg ROI', value: '0%', sub: 'This month' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-muted-foreground">{stat.label}</div>
            <div className="text-2xl font-bold mt-1">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="font-medium mb-4">Sales Performance</h2>
        <p className="text-sm text-muted-foreground text-center py-12">
          Start tracking sourced products to see performance metrics here.
        </p>
      </div>
    </div>
  );
}
