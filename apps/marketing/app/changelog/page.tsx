import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PageHeader } from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'Changelog — SourceTool',
  description:
    'See what\'s new in SourceTool. Product updates, new features, and improvements.',
};

const RELEASES = [
  {
    version: '1.0.0',
    date: 'February 2026',
    title: 'Initial Release',
    tag: 'launch',
    changes: [
      {
        type: 'new' as const,
        items: [
          'Chrome extension with side panel UI',
          'Instant profit analysis for FBA and FBM',
          'Deal scoring with BUY / MAYBE / PASS recommendations',
          'Competition analysis — seller counts, Buy Box data, lowest prices',
          'Risk alerts — IP complaints, hazmat, size tier, gating status',
          'Price and BSR history charts',
          'eBay cross-marketplace comparison',
          'Detailed Amazon and eBay fee breakdowns',
          'Dark and light theme support',
          'Automatic activation on Amazon product pages',
        ],
      },
    ],
  },
];

const TYPE_STYLES = {
  new: { label: 'New', className: 'bg-green-500/10 text-green-400' },
  improved: { label: 'Improved', className: 'bg-blue-500/10 text-blue-400' },
  fixed: { label: 'Fixed', className: 'bg-yellow-500/10 text-yellow-400' },
};

export default function ChangelogPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHeader
          title="Changelog"
          description="New features, improvements, and fixes. We ship updates regularly to make SourceTool better."
        />

        <section className="pb-20 px-5">
          <div className="max-w-3xl mx-auto">
            <div className="relative pl-8 border-l-2 border-dashed border-card-border flex flex-col gap-12">
              {RELEASES.map((release) => (
                <div key={release.version} className="relative">
                  <div className="absolute -left-[25px] w-3 h-3 rounded-full bg-accent" />

                  {/* Header */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="text-text-primary font-bold text-lg">
                      v{release.version}
                    </span>
                    <span className="text-text-dim text-sm">{release.date}</span>
                    {release.tag === 'launch' && (
                      <span className="bg-accent-glow text-accent text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Launch
                      </span>
                    )}
                  </div>

                  <h3 className="text-text-primary font-semibold text-base mb-4">
                    {release.title}
                  </h3>

                  {/* Change groups */}
                  {release.changes.map((group) => {
                    const style = TYPE_STYLES[group.type];
                    return (
                      <div key={group.type} className="mb-4">
                        <span
                          className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3 ${style.className}`}
                        >
                          {style.label}
                        </span>
                        <ul className="flex flex-col gap-2">
                          {group.items.map((item) => (
                            <li
                              key={item}
                              className="flex items-start gap-2.5 text-sm"
                            >
                              <span className="text-accent mt-0.5">&bull;</span>
                              <span className="text-text-muted">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Upcoming */}
            <div className="mt-16 bg-card border border-card-border rounded-2xl p-8 text-center">
              <h3 className="text-text-primary font-bold text-lg mb-2">
                What&apos;s next?
              </h3>
              <p className="text-text-muted text-sm leading-relaxed mb-6 max-w-md mx-auto">
                We&apos;re working on iOS and Android apps, additional Amazon
                marketplaces, batch scanning, supplier list management, and
                advanced analytics.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  'iOS App',
                  'Android App',
                  'More Marketplaces',
                  'Batch Scanning',
                  'Supplier Lists',
                  'Advanced Analytics',
                ].map((item) => (
                  <span
                    key={item}
                    className="bg-accent-glow text-accent text-xs font-medium px-3 py-1 rounded-full"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
