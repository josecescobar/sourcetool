'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Package, BarChart3, Upload, List, ShieldAlert, Users, Settings, LogOut, Search, ShoppingBag } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { EmailVerificationBanner } from '@/components/email-verification-banner';

const navItems = [
  { href: '/products', label: 'Products', icon: Search },
  { href: '/bulk-scan', label: 'Bulk Scan', icon: Upload },
  { href: '/buy-list', label: 'Buy List', icon: List },
  { href: '/sourced-products', label: 'Sourced', icon: ShoppingBag },
  { href: '/performance', label: 'Performance', icon: BarChart3 },
  { href: '/alerts', label: 'Alerts', icon: ShieldAlert },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    apiClient.get('/auth/me').then((data) => {
      if (data.success) {
        setUser(data.data);
      }
    }).catch(() => {});

    apiClient.get('/product-watches/alerts/count').then((data) => {
      if (data.success) setAlertCount(data.data.count);
    }).catch(() => {});
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white flex flex-col">
        <div className="p-6">
          <Link href="/products" className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">SourceTool</span>
          </Link>
        </div>

        <nav className="flex-1 px-3">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors mb-1 ${
                pathname === href
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}>
              <Icon className="h-4 w-4" />
              {label}
              {href === '/alerts' && alertCount > 0 && (
                <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] leading-none text-white">
                  {alertCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="border-t p-3">
          <button onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {user && !user.emailVerified && !user.googleId && <EmailVerificationBanner />}
        {children}
      </main>
    </div>
  );
}
