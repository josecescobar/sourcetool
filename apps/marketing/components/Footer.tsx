import Link from 'next/link';
import { Logo } from './Logo';

const PRODUCT_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'Changelog', href: '/changelog' },
  { label: 'FAQ', href: '/faq' },
];

const COMPANY_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
];

export function Footer() {
  return (
    <footer className="bg-surface border-t border-divider pt-14 pb-8 px-5">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-3">
            <Logo size={24} />
            <p className="text-text-dim text-sm leading-relaxed max-w-xs">
              Instant profit analysis, deal scoring, and risk alerts for Amazon
              sellers.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-text-primary text-sm font-semibold mb-4">Product</h4>
            <ul className="flex flex-col gap-2.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-dim text-sm hover:text-text-muted transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-text-primary text-sm font-semibold mb-4">Company</h4>
            <ul className="flex flex-col gap-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-dim text-sm hover:text-text-muted transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-text-primary text-sm font-semibold mb-4">Legal</h4>
            <ul className="flex flex-col gap-2.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-dim text-sm hover:text-text-muted transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-divider pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-text-dim text-xs">
            &copy; 2026 SourceTool. All rights reserved.
          </p>
          <a
            href="https://chrome.google.com/webstore"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent text-xs font-medium hover:underline"
          >
            Install on Chrome Web Store
          </a>
        </div>
      </div>
    </footer>
  );
}
