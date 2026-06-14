import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PageHeader } from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'Features — SourceTool',
  description:
    'Explore every SourceTool feature: profit analysis, deal scoring, competition data, risk alerts, price history, eBay comparison, and fee breakdowns.',
};

const FEATURES = [
  {
    id: 'profit-analysis',
    icon: '$',
    title: 'Instant Profit Analysis',
    tagline: 'Know your numbers before you buy',
    description:
      'SourceTool calculates net profit, ROI, and margin in real time for both FBA and FBM fulfillment methods. Enter your buy cost and see exactly what you\'ll make after all fees, shipping, and costs are deducted.',
    highlights: [
      'Real-time profit, ROI, and margin calculations',
      'Toggle between FBA and FBM fulfillment',
      'Editable buy cost with instant recalculation',
      'Accounts for referral fees, FBA fees, and inbound shipping',
      'Break-even price indicator',
    ],
  },
  {
    id: 'deal-scoring',
    icon: '\u2605',
    title: 'Deal Scoring',
    tagline: 'BUY, MAYBE, or PASS — at a glance',
    description:
      'Our scoring algorithm analyzes profit margins, sales velocity, competition levels, and risk factors to give you a clear BUY, MAYBE, or PASS recommendation. Stop second-guessing and start sourcing with confidence.',
    highlights: [
      'Composite score weighing profit, demand, and risk',
      'Color-coded BUY / MAYBE / PASS verdict',
      'Factors in sales rank, competition, and margins',
      'Adjusts to your personal profit thresholds',
      'Saves hours of manual analysis per product',
    ],
  },
  {
    id: 'competition',
    icon: '\u2639',
    title: 'Competition Analysis',
    tagline: 'See exactly who you\'re up against',
    description:
      'Get a full picture of the competitive landscape. See the number of FBA and FBM sellers, who owns the Buy Box, Buy Box price stability, and the lowest current offer — all in one panel.',
    highlights: [
      'FBA and FBM seller count breakdown',
      'Buy Box owner identification',
      'Buy Box price stability indicator',
      'Lowest FBA and FBM offer prices',
      'Amazon on-listing detection',
    ],
  },
  {
    id: 'risk-alerts',
    icon: '\u26A0',
    title: 'Risk Alerts',
    tagline: 'Avoid costly mistakes before they happen',
    description:
      'SourceTool scans for potential issues that could cost you money or get your account in trouble. Get warnings about IP complaints, hazmat restrictions, oversize fees, and category gating before you commit to a purchase.',
    highlights: [
      'Intellectual property complaint detection',
      'Hazmat and dangerous goods flags',
      'Product size tier classification',
      'Category and brand gating status',
      'Meltable and expiration date warnings',
    ],
  },
  {
    id: 'price-history',
    icon: '\u2197',
    title: 'Price History',
    tagline: 'Understand trends, not just snapshots',
    description:
      'View historical price and BSR (Best Sellers Rank) charts to understand how a product has performed over time. Identify seasonal patterns, price drops, and demand trends before you invest.',
    highlights: [
      'Interactive price history charts',
      'BSR trend visualization over time',
      'Seasonal pattern identification',
      '30, 90, and 180-day trend windows',
      'Spot price manipulation and volatility',
    ],
  },
  {
    id: 'ebay-comparison',
    icon: '\u21C4',
    title: 'eBay Cross-Marketplace',
    tagline: 'Compare Amazon vs eBay side by side',
    description:
      'Instantly compare what a product sells for on eBay versus Amazon. See eBay fees, estimated profit, and whether cross-listing could increase your returns — all without leaving the Amazon product page.',
    highlights: [
      'Head-to-head Amazon vs eBay profit comparison',
      'eBay fee calculations included',
      'eBay average selling price lookup',
      'Cross-marketplace arbitrage opportunities',
      'Single-click comparison from any Amazon listing',
    ],
  },
  {
    id: 'fee-breakdown',
    icon: '\u2261',
    title: 'Fee Breakdown',
    tagline: 'See exactly where your money goes',
    description:
      'Get a line-by-line breakdown of every fee Amazon and eBay charge. From referral fees and FBA fulfillment costs to variable closing fees — nothing is hidden. Understand your true cost of selling.',
    highlights: [
      'Amazon referral fee by category',
      'FBA pick, pack, and weight handling fees',
      'Storage and inbound placement fees',
      'eBay final value and payment processing fees',
      'Category-specific fee rate tables',
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHeader
          title="Features"
          description="Seven powerful tools that work together to help you make smarter, faster sourcing decisions."
        />

        <section className="pb-20 px-5">
          <div className="max-w-5xl mx-auto flex flex-col gap-20">
            {FEATURES.map((feature, i) => (
              <div
                key={feature.id}
                id={feature.id}
                className={`flex flex-col ${i % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-10 items-center`}
              >
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-accent-glow flex items-center justify-center text-accent text-lg">
                      {feature.icon}
                    </div>
                    <span className="text-text-dim text-sm font-medium uppercase tracking-wider">
                      {feature.tagline}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
                    {feature.title}
                  </h2>
                  <p className="text-text-muted text-base leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  <ul className="flex flex-col gap-2.5">
                    {feature.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm">
                        <span className="text-accent mt-0.5">\u2713</span>
                        <span className="text-text-muted">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Screenshot placeholder */}
                <div className="flex-1 w-full">
                  <div className="bg-card border border-card-border rounded-2xl p-16 flex items-center justify-center">
                    <span className="text-text-dim text-sm">Screenshot coming soon</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA band */}
        <section className="py-16 px-5">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
              Ready to source{' '}
              <span className="gradient-text">with confidence?</span>
            </h2>
            <p className="text-text-muted text-lg mb-8">
              Install SourceTool for free and start analyzing products in
              seconds.
            </p>
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gradient inline-flex text-white font-semibold px-8 py-3 rounded-xl text-base"
            >
              Install Free on Chrome
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
