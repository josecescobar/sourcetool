import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PageHeader } from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'About — SourceTool',
  description:
    'Learn about SourceTool — our mission to make product sourcing transparent, fast, and accessible for every Amazon seller.',
};

const VALUES = [
  {
    icon: '\u26A1',
    title: 'Speed',
    description:
      'Sourcing decisions shouldn\'t take minutes. SourceTool delivers analysis in seconds so you can evaluate more products in less time.',
  },
  {
    icon: '\uD83D\uDD0D',
    title: 'Transparency',
    description:
      'No hidden fees, no black-box algorithms. Every number is explained, every calculation is visible, and the tool is free to use.',
  },
  {
    icon: '\uD83D\uDEE1\uFE0F',
    title: 'Accuracy',
    description:
      'We use real Amazon fee tables and live data to make sure your profit estimates match reality — not guesswork.',
  },
  {
    icon: '\uD83E\uDD1D',
    title: 'Simplicity',
    description:
      'No account sign-ups, no complicated setup. Install the extension and start sourcing. It should be that easy.',
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHeader
          title="About SourceTool"
          description="We're building the sourcing tool we always wished existed — fast, transparent, and free."
        />

        {/* Mission */}
        <section className="pb-16 px-5">
          <div className="max-w-3xl mx-auto">
            <div className="bg-card border border-card-border rounded-2xl p-8 sm:p-10">
              <h2 className="text-xl font-bold text-text-primary mb-4">Our Mission</h2>
              <div className="flex flex-col gap-4 text-text-muted text-base leading-relaxed">
                <p>
                  Amazon arbitrage and wholesale sourcing shouldn&apos;t require
                  expensive subscriptions, complex spreadsheets, or five
                  different tools open at once.
                </p>
                <p>
                  SourceTool was born from frustration with the status quo.
                  Existing tools were either too expensive for new sellers, too
                  complex to learn quickly, or scattered analysis across multiple
                  tabs and windows.
                </p>
                <p>
                  We set out to build a single, focused tool that lives right
                  inside your browser and gives you everything you need to make a
                  sourcing decision — profit, competition, risk, and a clear
                  recommendation — in seconds, not minutes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="pb-20 px-5">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center mb-10">
              What we <span className="gradient-text">believe in</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {VALUES.map((value) => (
                <div
                  key={value.title}
                  className="bg-card border border-card-border rounded-xl p-6"
                >
                  <div className="text-2xl mb-3">{value.icon}</div>
                  <h3 className="text-text-primary font-semibold text-base mb-2">
                    {value.title}
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline / Story */}
        <section className="pb-20 px-5">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center mb-10">
              The <span className="gradient-text">journey so far</span>
            </h2>
            <div className="relative pl-8 border-l-2 border-dashed border-card-border flex flex-col gap-8">
              {[
                {
                  date: 'Early 2026',
                  title: 'The idea',
                  text: 'Frustrated by juggling multiple sourcing tools, we started building a browser-native alternative that puts everything in one side panel.',
                },
                {
                  date: 'Q1 2026',
                  title: 'Chrome launch',
                  text: 'SourceTool ships on the Chrome Web Store with profit analysis, deal scoring, competition data, risk alerts, price history, eBay comparison, and fee breakdowns.',
                },
                {
                  date: 'Coming next',
                  title: 'Mobile apps & more marketplaces',
                  text: 'iOS and Android apps are in development. Additional Amazon marketplaces, batch scanning, and advanced analytics are on the roadmap.',
                },
              ].map((event) => (
                <div key={event.date} className="relative">
                  <div className="absolute -left-[25px] w-3 h-3 rounded-full bg-accent" />
                  <span className="text-accent text-xs font-semibold uppercase tracking-wider">
                    {event.date}
                  </span>
                  <h3 className="text-text-primary font-semibold text-lg mt-1 mb-1">
                    {event.title}
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    {event.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-5">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
              Try it yourself
            </h2>
            <p className="text-text-muted text-lg mb-8">
              SourceTool is free to install. No account, no credit card, no
              strings attached.
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
