const FEATURES = [
  {
    icon: '$',
    title: 'Instant Profit Analysis',
    description:
      'Calculate profit, ROI, and margin for FBA and FBM with editable buy cost.',
  },
  {
    icon: '\u2605',
    title: 'Deal Scoring',
    description:
      'AI-powered deal quality score \u2014 BUY, MAYBE, or PASS at a glance.',
  },
  {
    icon: '\u2639',
    title: 'Competition Analysis',
    description:
      'FBA/FBM seller counts, Buy Box ownership and stability, lowest price.',
  },
  {
    icon: '\u26A0',
    title: 'Risk Alerts',
    description:
      'IP complaints, hazmat, size tier, and gating status before you buy.',
  },
  {
    icon: '\u2197',
    title: 'Price History',
    description:
      'Historical price and BSR trend charts, seasonal patterns.',
  },
  {
    icon: '\u21C4',
    title: 'eBay Cross-Marketplace',
    description:
      'Head-to-head Amazon vs eBay profit comparison.',
  },
  {
    icon: '\u2261',
    title: 'Fee Breakdown',
    description:
      'Detailed Amazon referral, FBA fulfillment, and eBay fee calculations.',
  },
];

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-6 hover:-translate-y-1 transition-transform">
      <div className="w-10 h-10 rounded-lg bg-accent-glow flex items-center justify-center text-accent text-lg mb-4">
        {icon}
      </div>
      <h3 className="text-text-primary font-semibold text-base mb-2">{title}</h3>
      <p className="text-text-muted text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="py-20 px-5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Everything you need to source{' '}
            <span className="gradient-text">with confidence</span>
          </h2>
          <p className="text-text-muted text-lg max-w-xl mx-auto">
            Seven powerful tools working together to help you make smarter
            sourcing decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
