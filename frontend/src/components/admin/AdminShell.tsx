'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  adminTabFromPath,
} from '@/lib/admin-dashboard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { computeOrderStats } from '@/components/admin/OrdersTable';

type AdminShellContextValue = {
  search: string;
  setSearch: (v: string) => void;
  orderStats: ReturnType<typeof computeOrderStats>;
  refreshOrders: () => Promise<void>;
  orders: Awaited<ReturnType<typeof api.adminOrders>>;
  setOrders: (orders: Awaited<ReturnType<typeof api.adminOrders>>) => void;
  message: string | null;
  setMessage: (v: string | null) => void;
  error: string | null;
  setError: (v: string | null) => void;
};

const AdminShellContext = createContext<AdminShellContextValue | null>(null);

export function useAdminShell() {
  const ctx = useContext(AdminShellContext);
  if (!ctx) throw new Error('useAdminShell must be used within AdminShell');
  return ctx;
}

const COLLAPSE_KEY = 'fce-admin-sidebar-collapsed';

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const tab = adminTabFromPath(pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof api.adminOrders>>>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const refreshOrders = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    const data = await api.adminOrders(user.accessToken);
    setOrders(data);
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    void refreshOrders().catch((e: Error) => setError(e.message));
  }, [user, refreshOrders]);

  useEffect(() => {
    setMessage(null);
    setError(null);
    setSearch('');
  }, [pathname]);

  const orderStats = useMemo(() => computeOrderStats(orders), [orders]);

  const filteredOrderStats = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || tab !== 'orders') return orderStats;
    const filtered = orders.filter((o) => {
      const hay = [
        o.order_number,
        o.status,
        o.platform,
        o.guest_email,
        o.profiles?.email,
        o.profiles?.full_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
    return computeOrderStats(filtered);
  }, [orders, search, tab, orderStats]);

  const ctx = useMemo<AdminShellContextValue>(
    () => ({
      search,
      setSearch,
      orderStats,
      refreshOrders,
      orders,
      setOrders,
      message,
      setMessage,
      error,
      setError,
    }),
    [search, orderStats, refreshOrders, orders, message, error],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0c10] font-sans text-sm text-white/60">
        Loading admin…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0c10] px-4 font-sans">
        <div className="max-w-md text-center">
          <Image
            src="/brand/logo-png.png"
            alt="FutCoins Empire"
            width={180}
            height={54}
            className="mx-auto h-12 w-auto"
          />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">Admin access</h1>
          <p className="mt-2 text-sm text-white/55">Sign in with an admin account to continue.</p>
          <Link
            href="/account?next=/admin&mode=signin"
            className="mt-6 inline-flex rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-black"
          >
            Go to account
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0c10] px-4 font-sans">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Access denied</h1>
          <p className="mt-2 text-sm text-white/55">
            Your account is not an admin. Ask an existing admin to promote you, or set{' '}
            <code className="text-gold">ADMIN_BOOTSTRAP_EMAIL</code> and sign in with that address.
          </p>
          <Link href="/" className="mt-6 inline-block text-gold underline">
            Back to store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AdminShellContext.Provider value={ctx}>
      <div className="flex h-dvh overflow-hidden bg-[#0b0c10] font-sans text-white antialiased admin-panel">
        <AdminSidebar
          tab={tab}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          badges={{ orders: orderStats.newCount }}
        />

        <div
          className={`flex min-h-0 min-w-0 flex-1 flex-col transition-[padding] duration-200 ${
            collapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'
          }`}
        >
          <AdminTopBar
            tab={tab}
            adminName={user.fullName || user.email.split('@')[0] || 'Admin'}
            search={search}
            onSearch={setSearch}
            onMenu={() => setSidebarOpen(true)}
            onLogout={() => void signOut()}
            notificationCount={orderStats.newCount}
            orderStats={tab === 'orders' ? filteredOrderStats : null}
          />

          <div className="admin-scroll min-h-0 flex-1 overflow-auto px-4 py-5 sm:px-6">
            {message && (
              <p className="mb-4 rounded-lg border border-green/30 bg-green/10 px-3 py-2 text-sm text-green">
                {message}
              </p>
            )}
            {error && (
              <p className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}
            {children}
          </div>

          <footer className="flex items-center justify-between gap-4 overflow-hidden border-t border-white/8 px-4 py-3 text-[11px] text-white/35 sm:px-6">
            <span className="truncate whitespace-nowrap">
              FutCoins Empire Admin Panel · v2.1.0
            </span>
            <div className="flex shrink-0 items-center gap-4 whitespace-nowrap">
              <button
                type="button"
                onClick={() => void signOut()}
                className="text-white/50 hover:text-gold"
              >
                Sign out
              </button>
              <span>© {new Date().getFullYear()} FutCoins Empire. All rights reserved.</span>
            </div>
          </footer>
        </div>
      </div>
    </AdminShellContext.Provider>
  );
}
