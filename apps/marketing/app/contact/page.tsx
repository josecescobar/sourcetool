import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PageHeader } from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'Contact — SourceTool',
  description:
    'Get in touch with the SourceTool team. Bug reports, feature requests, and general inquiries.',
};

const CONTACT_OPTIONS = [
  {
    icon: '\uD83D\uDCE7',
    title: 'Email',
    description: 'For general inquiries, feature requests, or partnership opportunities.',
    action: 'support@sourcetool.app',
    href: 'mailto:support@sourcetool.app',
  },
  {
    icon: '\uD83D\uDC1B',
    title: 'Bug Reports',
    description: 'Found something broken? Let us know and we\'ll fix it fast.',
    action: 'Report on GitHub',
    href: 'https://github.com',
  },
  {
    icon: '\uD83D\uDCA1',
    title: 'Feature Requests',
    description: 'Have an idea for SourceTool? We\'d love to hear what you need.',
    action: 'Request a Feature',
    href: 'mailto:features@sourcetool.app',
  },
];

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHeader
          title="Contact Us"
          description="Have a question, found a bug, or want to request a feature? We'd love to hear from you."
        />

        <section className="pb-20 px-5">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {CONTACT_OPTIONS.map((option) => (
                <a
                  key={option.title}
                  href={option.href}
                  target={option.href.startsWith('http') ? '_blank' : undefined}
                  rel={option.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="bg-card border border-card-border rounded-xl p-6 hover:-translate-y-1 transition-transform flex flex-col"
                >
                  <div className="text-2xl mb-3">{option.icon}</div>
                  <h3 className="text-text-primary font-semibold text-base mb-2">
                    {option.title}
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed mb-4 flex-1">
                    {option.description}
                  </p>
                  <span className="text-accent text-sm font-medium">
                    {option.action} &rarr;
                  </span>
                </a>
              ))}
            </div>

            {/* Response time note */}
            <div className="mt-12 bg-card border border-card-border rounded-2xl p-8 text-center">
              <h3 className="text-text-primary font-bold text-lg mb-2">
                Response Times
              </h3>
              <p className="text-text-muted text-sm leading-relaxed max-w-lg mx-auto">
                We typically respond to emails within 24 hours on business days.
                Bug reports are triaged immediately and critical issues are
                patched as quickly as possible.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
