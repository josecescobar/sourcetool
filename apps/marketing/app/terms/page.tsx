import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PageHeader } from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'Terms of Service — SourceTool',
  description: 'SourceTool Terms of Service — the rules and guidelines for using our product.',
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHeader
          title="Terms of Service"
          description="Last updated: February 1, 2026"
        />

        <section className="pb-20 px-5">
          <div className="max-w-3xl mx-auto">
            <Block title="1. Acceptance of Terms">
              <p>
                By installing or using the SourceTool Chrome extension or
                visiting the SourceTool website (&quot;Service&quot;), you agree
                to be bound by these Terms of Service (&quot;Terms&quot;). If
                you do not agree, do not use the Service.
              </p>
            </Block>

            <Block title="2. Description of Service">
              <p>
                SourceTool is a Chrome browser extension that provides product
                sourcing analysis for Amazon sellers, including profit
                calculations, competition data, risk alerts, and related
                features. The Service is provided &quot;as is&quot; and is
                currently offered free of charge.
              </p>
            </Block>

            <Block title="3. Use of the Service">
              <p>You agree to:</p>
              <ul>
                <li>Use SourceTool only for lawful purposes.</li>
                <li>
                  Not attempt to reverse engineer, decompile, or disassemble the
                  extension.
                </li>
                <li>
                  Not use SourceTool in any way that could damage, disable, or
                  impair the Service or interfere with other users.
                </li>
                <li>
                  Not use automated systems or bots to access the Service in a
                  manner that exceeds reasonable use.
                </li>
                <li>
                  Comply with Amazon&apos;s Terms of Service and any applicable
                  marketplace policies.
                </li>
              </ul>
            </Block>

            <Block title="4. Data Accuracy">
              <p>
                SourceTool provides estimates and analysis based on publicly
                available data. We do not guarantee the accuracy, completeness,
                or timeliness of any information displayed. Sourcing decisions
                are made at your own risk. Always verify critical data before
                making purchasing decisions.
              </p>
            </Block>

            <Block title="5. Intellectual Property">
              <p>
                The SourceTool name, logo, website content, and extension code
                are the intellectual property of SourceTool. You may not copy,
                modify, distribute, or create derivative works based on our
                Service without written permission.
              </p>
            </Block>

            <Block title="6. Limitation of Liability">
              <p>
                To the maximum extent permitted by law, SourceTool shall not be
                liable for any indirect, incidental, special, consequential, or
                punitive damages arising from your use of the Service. This
                includes, without limitation, loss of profits, data, or business
                opportunities.
              </p>
            </Block>

            <Block title="7. Disclaimer of Warranties">
              <p>
                The Service is provided &quot;as is&quot; and &quot;as
                available&quot; without warranties of any kind, either express or
                implied, including but not limited to implied warranties of
                merchantability, fitness for a particular purpose, and
                non-infringement.
              </p>
            </Block>

            <Block title="8. Termination">
              <p>
                We reserve the right to suspend or terminate access to the
                Service at any time, for any reason, without prior notice. You
                may stop using the Service at any time by uninstalling the
                extension.
              </p>
            </Block>

            <Block title="9. Changes to Terms">
              <p>
                We may update these Terms from time to time. Changes will be
                posted on this page with an updated date. Continued use of the
                Service after changes constitutes acceptance of the revised
                Terms.
              </p>
            </Block>

            <Block title="10. Governing Law">
              <p>
                These Terms shall be governed by and construed in accordance
                with the laws of the United States, without regard to conflict
                of law principles.
              </p>
            </Block>

            <Block title="11. Contact">
              <p>
                Questions about these Terms? Email us at{' '}
                <a
                  href="mailto:legal@sourcetool.app"
                  className="text-accent hover:underline"
                >
                  legal@sourcetool.app
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
      <div className="text-text-muted text-sm leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mt-2 [&_li]:mb-1.5 [&_p]:mb-2">
        {children}
      </div>
    </div>
  );
}
