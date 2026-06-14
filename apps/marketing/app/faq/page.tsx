import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PageHeader } from '@/components/PageHeader';
import { FaqAccordion } from '@/components/FaqAccordion';

export const metadata: Metadata = {
  title: 'FAQ — SourceTool',
  description:
    'Frequently asked questions about SourceTool — installation, features, pricing, data, and troubleshooting.',
};

const FAQ_SECTIONS = [
  {
    category: 'Getting Started',
    items: [
      {
        q: 'What is SourceTool?',
        a: 'SourceTool is a free Chrome extension that helps Amazon sellers analyze product profitability, competition, and risk directly in the browser. It opens as a side panel while you browse Amazon, giving you instant sourcing insights without switching tabs.',
      },
      {
        q: 'How do I install SourceTool?',
        a: 'Visit the Chrome Web Store, search for "SourceTool", and click "Add to Chrome". The extension installs in one click — no account or sign-up required.',
      },
      {
        q: 'Do I need an account to use SourceTool?',
        a: 'No. SourceTool works immediately after installation. There is no account creation, login, or email required to get started.',
      },
      {
        q: 'Which browsers are supported?',
        a: 'SourceTool works on Google Chrome (desktop). Support for other Chromium-based browsers like Edge and Brave is planned. Mobile apps for iOS and Android are coming soon.',
      },
      {
        q: 'Does SourceTool work on all Amazon marketplaces?',
        a: 'Currently SourceTool supports Amazon US (amazon.com). Support for additional marketplaces including UK, Canada, Germany, and more is on the roadmap.',
      },
    ],
  },
  {
    category: 'Features & Usage',
    items: [
      {
        q: 'How does the profit calculator work?',
        a: 'Enter your buy cost and SourceTool automatically calculates net profit, ROI, and margin after deducting Amazon referral fees, FBA fulfillment fees, and inbound shipping costs. You can toggle between FBA and FBM fulfillment to compare.',
      },
      {
        q: 'What does the deal score mean?',
        a: 'The deal score combines profit margin, sales velocity, competition level, and risk factors into a simple BUY, MAYBE, or PASS recommendation. It\'s designed to help you make faster sourcing decisions with confidence.',
      },
      {
        q: 'What risk alerts does SourceTool check for?',
        a: 'SourceTool checks for intellectual property complaints, hazmat restrictions, product size tier (standard vs oversize), category gating, meltable items, and other factors that could affect your ability to sell a product.',
      },
      {
        q: 'Can I compare Amazon and eBay prices?',
        a: 'Yes. The eBay Cross-Marketplace feature shows you what a product sells for on eBay, calculates eBay fees, and compares profit side by side with Amazon — all from the Amazon product page.',
      },
      {
        q: 'Does SourceTool show price history?',
        a: 'Yes. SourceTool displays historical price and BSR (Best Sellers Rank) charts so you can identify trends, seasonal patterns, and price stability before sourcing a product.',
      },
    ],
  },
  {
    category: 'Pricing & Plans',
    items: [
      {
        q: 'Is SourceTool free?',
        a: 'Yes, SourceTool is currently free to use. Install it from the Chrome Web Store and access all features at no cost.',
      },
      {
        q: 'Will there be paid plans in the future?',
        a: 'We may introduce premium features in the future, but the core product will always have a generous free tier. We\'ll give plenty of notice before any changes.',
      },
    ],
  },
  {
    category: 'Data & Privacy',
    items: [
      {
        q: 'What data does SourceTool collect?',
        a: 'SourceTool only accesses product data from Amazon pages you visit. We do not track your browsing history, collect personal information, or sell any data. See our Privacy Policy for full details.',
      },
      {
        q: 'Does SourceTool access my Amazon seller account?',
        a: 'No. SourceTool only reads publicly available product page data. It never asks for your Amazon seller credentials and has no access to your Seller Central account.',
      },
    ],
  },
  {
    category: 'Troubleshooting',
    items: [
      {
        q: 'The side panel isn\'t opening on Amazon. What should I do?',
        a: 'Make sure the extension is enabled in Chrome\'s extension settings (chrome://extensions). Try refreshing the Amazon page. If the issue persists, uninstall and reinstall the extension from the Chrome Web Store.',
      },
      {
        q: 'The data looks incorrect for a product. How can I report it?',
        a: 'Product data comes from multiple sources and occasionally may lag. If you notice consistently incorrect data, reach out via our Contact page and include the ASIN so we can investigate.',
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHeader
          title="Frequently Asked Questions"
          description="Everything you need to know about installing, using, and getting the most out of SourceTool."
        />

        <section className="pb-20 px-5">
          <div className="max-w-3xl mx-auto flex flex-col gap-12">
            {FAQ_SECTIONS.map((section) => (
              <div key={section.category}>
                <h2 className="text-xl font-bold text-text-primary mb-5">
                  {section.category}
                </h2>
                <div className="flex flex-col gap-3">
                  {section.items.map((item) => (
                    <FaqAccordion key={item.q} question={item.q} answer={item.a} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-5">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-extrabold tracking-tight mb-3">
              Still have questions?
            </h2>
            <p className="text-text-muted text-base mb-6">
              We&apos;re happy to help. Reach out and we&apos;ll get back to you
              as soon as we can.
            </p>
            <a
              href="/contact"
              className="btn-outline inline-flex text-text-primary font-semibold px-7 py-3 rounded-xl text-base"
            >
              Contact Us
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
