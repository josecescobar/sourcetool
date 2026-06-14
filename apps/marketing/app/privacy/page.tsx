import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PageHeader } from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'Privacy Policy — SourceTool',
  description: 'SourceTool Privacy Policy — how we handle your data.',
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHeader
          title="Privacy Policy"
          description="Last updated: February 1, 2026"
        />

        <section className="pb-20 px-5">
          <div className="max-w-3xl mx-auto prose-custom">
            <Block title="Overview">
              <p>
                SourceTool (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;)
                respects your privacy. This Privacy Policy explains what data
                the SourceTool Chrome extension and website collect, how we use
                it, and your choices regarding that data.
              </p>
            </Block>

            <Block title="What We Collect">
              <h4>Chrome Extension</h4>
              <ul>
                <li>
                  <strong>Product page data:</strong> When you visit an Amazon
                  product page, SourceTool reads publicly available information
                  (title, price, ASIN, category, seller offers) to perform
                  analysis. This data is processed locally in your browser and is
                  not sent to our servers.
                </li>
                <li>
                  <strong>User preferences:</strong> Settings like theme
                  preference and default fulfillment method are stored locally
                  using Chrome&apos;s storage API.
                </li>
              </ul>

              <h4>Website</h4>
              <ul>
                <li>
                  <strong>Analytics:</strong> We may use privacy-respecting
                  analytics to understand aggregate traffic patterns (pages
                  visited, referral source). We do not use cookies for tracking.
                </li>
                <li>
                  <strong>Contact forms:</strong> If you email us, we store your
                  email address and message to respond to your inquiry.
                </li>
              </ul>
            </Block>

            <Block title="What We Don't Collect">
              <ul>
                <li>We do not collect or store your browsing history.</li>
                <li>
                  We do not access your Amazon seller account or credentials.
                </li>
                <li>We do not sell, rent, or share personal data with third parties.</li>
                <li>We do not use tracking cookies or fingerprinting.</li>
                <li>We do not collect payment information (the extension is free).</li>
              </ul>
            </Block>

            <Block title="Data Storage & Security">
              <p>
                All analysis data is processed locally in your browser. User
                preferences are stored using Chrome&apos;s built-in storage API
                and never leave your device. We do not maintain external
                databases of user data.
              </p>
            </Block>

            <Block title="Third-Party Services">
              <p>
                SourceTool may make requests to third-party APIs (e.g., for
                price history or eBay data) to provide analysis features. These
                requests contain only product identifiers (ASINs, UPCs) and do
                not include personal information.
              </p>
            </Block>

            <Block title="Children's Privacy">
              <p>
                SourceTool is not directed at children under 13. We do not
                knowingly collect personal information from children.
              </p>
            </Block>

            <Block title="Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time. Changes
                will be posted on this page with an updated &quot;Last
                updated&quot; date. Continued use of SourceTool after changes
                constitutes acceptance.
              </p>
            </Block>

            <Block title="Contact">
              <p>
                Questions about this policy? Email us at{' '}
                <a
                  href="mailto:privacy@sourcetool.app"
                  className="text-accent hover:underline"
                >
                  privacy@sourcetool.app
                </a>
                .
              </p>
            </Block>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-text-primary font-semibold text-lg mb-3">{title}</h3>
      <div className="text-text-muted text-sm leading-relaxed [&_h4]:text-text-primary [&_h4]:font-medium [&_h4]:text-sm [&_h4]:mt-4 [&_h4]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mt-2 [&_li]:mb-1.5 [&_p]:mb-2 [&_strong]:text-text-primary">
        {children}
      </div>
    </div>
  );
}
