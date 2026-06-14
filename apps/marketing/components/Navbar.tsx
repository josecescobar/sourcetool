'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from './Logo';
import { useAuth } from '@/lib/auth-context';
import { APP_URL } from '@/lib/app-url';

const NAV_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'FAQ', href: '/faq' },
  { label: 'About', href: '/about' },
  { label: 'Changelog', href: '/changelog' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/');
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-lg border-b border-divider">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Logo size={28} />

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-text-muted text-sm font-medium hover:text-text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop auth / CTA */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <a
                href={APP_URL}
                className="text-text-muted text-sm font-medium hover:text-text-primary transition-colors"
              >
                Dashboard
              </a>
              <button
                onClick={handleLogout}
                className="btn-outline text-text-primary text-sm font-semibold px-4 py-2 rounded-lg"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-text-muted text-sm font-medium hover:text-text-primary transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="btn-gradient text-white text-sm font-semibold px-5 py-2 rounded-lg"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden flex flex-col gap-1.5 p-2"
          aria-label="Toggle menu"
        >
          <span
            className={`block w-5 h-0.5 bg-text-primary transition-transform ${open ? 'rotate-45 translate-y-2' : ''}`}
          />
          <span
            className={`block w-5 h-0.5 bg-text-primary transition-opacity ${open ? 'opacity-0' : ''}`}
          />
          <span
            className={`block w-5 h-0.5 bg-text-primary transition-transform ${open ? '-rotate-45 -translate-y-2' : ''}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-surface border-b border-divider px-5 pb-4 pt-2 flex flex-col gap-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-text-muted text-sm font-medium hover:text-text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <a
                href={APP_URL}
                onClick={() => setOpen(false)}
                className="text-text-muted text-sm font-medium hover:text-text-primary transition-colors"
              >
                Dashboard
              </a>
              <button
                onClick={() => { handleLogout(); setOpen(false); }}
                className="btn-outline text-text-primary text-sm font-semibold px-5 py-2 rounded-lg text-center"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="text-text-muted text-sm font-medium hover:text-text-primary transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="btn-gradient text-white text-sm font-semibold px-5 py-2 rounded-lg text-center"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
