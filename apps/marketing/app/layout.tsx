import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import { Providers } from '@/components/Providers';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: 'SourceTool — Source smarter. Sell profitably.',
  description:
    'Instant profit analysis, deal scoring, and risk alerts — right inside your browser while you shop on Amazon.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${dmSans.variable} font-[var(--font-dm-sans)] antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
