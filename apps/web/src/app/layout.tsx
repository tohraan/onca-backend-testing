'use client';

import { useState, useEffect } from 'react';
import "./globals.css";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SettingsProvider, useSettings } from '@/lib/context/SettingsContext';
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Activity,
  Landmark,
  Calculator,
  Building2,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  PieChart,
  Database,
  Sparkles,
  Bell,
  Receipt
} from 'lucide-react';

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { settings, loading: settingsLoading } = useSettings();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const isActive = (path: string) => pathname?.startsWith(path);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Documents', path: '/documents', icon: <FileText size={20} /> },
    { label: 'Invoices', path: '/invoices', icon: <FileText size={20} /> },
    { label: 'Expenses', path: '/expenses', icon: <Receipt size={20} /> },
    { label: 'Ledger & Tracking', path: '/ledger', icon: <Database size={20} /> },
    { label: 'Cash Flow', path: '/cashflow', icon: <Activity size={20} /> },
    { label: 'Banking', path: '/banking', icon: <Landmark size={20} /> },
    { label: 'Taxes', path: '/taxes', icon: <Calculator size={20} /> },
    { label: 'Investments', path: '/investments', icon: <Building2 size={20} /> },
    { label: 'Reports', path: '/reports', icon: <PieChart size={20} /> },
    { label: 'Google Sheets', path: '/sheets', icon: <Database size={20} /> },
    { label: 'AI Insights', path: '/insights', icon: <Sparkles size={20} /> },
    { label: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  // Don't show sidebar for landing, login, auth, or onboarding pages
  const isAuthPage = pathname === '/' || pathname === '/login' || pathname?.startsWith('/auth') || pathname?.startsWith('/onboarding');

  if (isAuthPage) {
    return <>{children}</>;
  }

  const userDisplayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userInitials = userDisplayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);

  // Use business name from settings, fallback to placeholder
  const businessName = settings.business_name || 'Your Business';

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside className="sidebar" style={{
        width: '240px',
        height: '100vh',
        overflowY: 'auto',
        flexShrink: 0,
        padding: '24px 16px'
      }}>
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'var(--brand-primary)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '800',
            fontSize: '1rem'
          }}>O</div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--brand-primary)', letterSpacing: '-0.02em', margin: 0 }}>ONCA</h1>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-tertiary)', marginBottom: '8px', paddingLeft: '12px', letterSpacing: '0.08em' }}>MENU</div>
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              style={{
                padding: '8px 12px',
                fontSize: '0.85rem',
                borderRadius: '8px',
                gap: '10px'
              }}
            >
              {item.icon && <span style={{ opacity: 0.8 }}>{item.icon}</span>}
              <span style={{ fontWeight: isActive(item.path) ? '700' : '500' }}>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: 'var(--radius-sm)', background: '#F9FAFB', border: '1px solid var(--border-primary)' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: '700' }}>
              {loading ? '...' : userInitials}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontWeight: '700', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {loading ? 'Loading...' : userDisplayName}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Org Admin</div>
            </div>
            <button onClick={handleLogout} style={{ color: 'var(--text-tertiary)', padding: '4px' }} title="Logout">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content" style={{ flex: 1, height: '100vh', overflowY: 'auto' }}>
        <div style={{ padding: '24px 40px' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>
              ONCA • {pathname?.split('/').pop()?.toUpperCase() || 'DASHBOARD'}
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <Bell size={18} color="var(--text-tertiary)" cursor="pointer" />
              <div style={{ height: '20px', width: '1px', background: 'var(--border-primary)' }}></div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--brand-primary)' }}>
                {settingsLoading ? '...' : businessName}
              </div>
            </div>
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SettingsProvider>
          <AppContent>{children}</AppContent>
        </SettingsProvider>
      </body>
    </html>
  );
}
