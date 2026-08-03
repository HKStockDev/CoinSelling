'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  formatGbp,
  type AdminDashboardData,
  type AdminTab,
} from '@/lib/admin-dashboard';
import { formatCoins, PLATFORMS, type Platform, type Product } from '@/lib/site';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { ComingSoon, DashboardView } from '@/components/admin/DashboardView';
import { OrdersTable, computeOrderStats } from '@/components/admin/OrdersTable';

export default function AdminPage() {
  const { user, loading, signOut } = useAuth();
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState<Platform>('ps4_ps5');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof api.adminOrders>>>([]);
  const [customers, setCustomers] = useState<
    Awaited<ReturnType<typeof api.adminCustomers>>
  >([]);
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const token = user.accessToken;
    let cancelled = false;

    async function load() {
      setFetching(true);
      setError(null);
      try {
        const orderData = await api.adminOrders(token);
        if (!cancelled) setOrders(orderData);

        if (tab === 'dashboard') {
          const data = await api.adminDashboard(token);
          if (!cancelled) setDashboard(data);
        }
        if (tab === 'products') {
          const data = await api.adminProducts(token, platform);
          if (!cancelled) setProducts(data);
        }
        if (tab === 'customers') {
          const data = await api.adminCustomers(token);
          if (!cancelled) setCustomers(data);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setFetching(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [user, tab, platform]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
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
  }, [orders, search]);

  const orderStats = useMemo(() => computeOrderStats(orders), [orders]);
  const filteredOrderStats = useMemo(
    () => computeOrderStats(filteredOrders),
    [filteredOrders],
  );

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.email, c.full_name, c.role].filter(Boolean).join(' ').toLowerCase().includes(q),
    );
  }, [customers, search]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0c10] text-sm text-white/60">
        Loading admin…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0c10] px-4">
        <div className="max-w-md text-center">
          <Image
            src="/brand/logo-png.png"
            alt="FutCoins Empire"
            width={180}
            height={54}
            className="mx-auto h-12 w-auto"
          />
          <h1 className="mt-6 font-display text-3xl text-white">Admin access</h1>
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
      <div className="flex min-h-screen items-center justify-center bg-[#0b0c10] px-4">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl text-white">Access denied</h1>
          <p className="mt-2 text-sm text-white/55">
            Your account is not an admin. Ask an existing admin to promote you,
            or set <code className="text-gold">ADMIN_BOOTSTRAP_EMAIL</code> and
            sign in with that address.
          </p>
          <Link href="/" className="mt-6 inline-block text-gold underline">
            Back to store
          </Link>
        </div>
      </div>
    );
  }

  async function savePrice(e: FormEvent<HTMLFormElement>, product: Product) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const form = new FormData(e.currentTarget);
    const pounds = Number(form.get('price'));
    const compare = form.get('compare');
    const note = String(form.get('note') || 'Seasonal update');
    if (!Number.isFinite(pounds) || pounds <= 0) {
      setError('Enter a valid GBP price');
      return;
    }
    try {
      await api.updatePrice(user!.accessToken, product.id, {
        priceGbpPence: Math.round(pounds * 100),
        compareAtGbpPence:
          compare === '' || compare == null
            ? null
            : Math.round(Number(compare) * 100),
        note,
      });
      setMessage(`Updated ${product.name}`);
      const refreshed = await api.adminProducts(user!.accessToken, platform);
      setProducts(refreshed);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const soonTabs: AdminTab[] = [
    'coupons',
    'withdrawals',
    'support',
    'settings',
    'logs',
    'reports',
    'notifications',
    'backups',
  ];

  return (
    <div className="flex h-dvh overflow-hidden bg-[#0b0c10] text-white">
      <AdminSidebar
        tab={tab}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        badges={{ orders: orderStats.newCount }}
        onSelect={(next) => {
          setTab(next);
          setMessage(null);
          setError(null);
        }}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:pl-[260px]">
        <AdminTopBar
          tab={tab}
          adminName={user.fullName || user.email.split('@')[0] || 'Admin'}
          search={search}
          onSearch={setSearch}
          onMenu={() => setSidebarOpen(true)}
          onLogout={() => void signOut()}
          notificationCount={orderStats.newCount || dashboard?.bottom.pendingCount || 0}
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
          {fetching && tab === 'dashboard' && !dashboard && (
            <p className="text-sm text-white/45">Loading dashboard…</p>
          )}

          {tab === 'dashboard' && dashboard && <DashboardView data={dashboard} />}

          {tab === 'products' && (
            <div className="animate-rise space-y-5">
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlatform(p.id)}
                    className={`rounded-lg px-3 py-1.5 text-sm ${
                      platform === p.id
                        ? 'bg-gold font-bold text-black'
                        : 'border border-white/10 text-white/70 hover:border-gold/40'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {products.map((product) => (
                  <form
                    key={product.id}
                    onSubmit={(e) => void savePrice(e, product)}
                    className="grid gap-3 rounded-xl border border-white/8 bg-[#12141a] p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:items-end"
                  >
                    <div>
                      <p className="font-semibold text-white">
                        {formatCoins(product.coin_amount)} · {product.name}
                      </p>
                      <p className="text-xs text-white/40">{product.slug}</p>
                    </div>
                    <label className="text-xs text-white/50">
                      Price (GBP)
                      <input
                        name="price"
                        type="number"
                        step="0.01"
                        min="0.01"
                        defaultValue={(product.price_gbp_pence / 100).toFixed(2)}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b0c10] px-2 py-2 text-sm text-white"
                      />
                    </label>
                    <label className="text-xs text-white/50">
                      Compare at (GBP)
                      <input
                        name="compare"
                        type="number"
                        step="0.01"
                        min="0.01"
                        defaultValue={
                          product.compare_at_gbp_pence
                            ? (product.compare_at_gbp_pence / 100).toFixed(2)
                            : ''
                        }
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b0c10] px-2 py-2 text-sm text-white"
                      />
                    </label>
                    <label className="text-xs text-white/50">
                      Note
                      <input
                        name="note"
                        defaultValue="Seasonal update"
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b0c10] px-2 py-2 text-sm text-white"
                      />
                    </label>
                    <button
                      type="submit"
                      className="rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-black"
                    >
                      Save
                    </button>
                  </form>
                ))}
              </div>
            </div>
          )}

          {(tab === 'orders' || tab === 'transactions') && (
            <div className="space-y-4">
              {tab === 'orders' && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:hidden">
                  {[
                    { label: 'Total', value: String(filteredOrderStats.total), tone: 'text-white' },
                    { label: 'Paid', value: String(filteredOrderStats.paid), tone: 'text-green' },
                    {
                      label: 'Processing',
                      value: String(filteredOrderStats.processing),
                      tone: 'text-sky-300',
                    },
                    {
                      label: 'Delivered',
                      value: String(filteredOrderStats.delivered),
                      tone: 'text-gold',
                    },
                    {
                      label: 'Cancelled',
                      value: String(filteredOrderStats.cancelled),
                      tone: 'text-danger',
                    },
                    {
                      label: 'Revenue',
                      value: formatGbp(filteredOrderStats.revenuePence),
                      tone: 'text-gold',
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-white/8 bg-[#12141a] px-3 py-2.5"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
                        {stat.label}
                      </p>
                      <p className={`mt-1 text-sm font-semibold ${stat.tone}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
              )}
              <OrdersTable
                orders={filteredOrders}
                onUpdateStatus={async (orderId, status) => {
                  try {
                    await api.updateOrderStatus(user.accessToken, orderId, { status });
                    const next = await api.adminOrders(user.accessToken);
                    setOrders(next);
                    setMessage(`Order marked ${status}.`);
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              />
            </div>
          )}

          {tab === 'customers' && (
            <div className="animate-rise overflow-hidden rounded-xl border border-white/8 bg-[#12141a]">
              <ul className="divide-y divide-white/6">
                {filteredCustomers.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <span>
                      <span className="font-medium text-white">{c.full_name || '—'}</span>
                      <span className="text-white/45"> · {c.email}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] uppercase tracking-wide text-white/50">
                        {c.role}
                      </span>
                      {c.id !== user.id && (
                        <button
                          type="button"
                          className="rounded-lg border border-white/12 px-2.5 py-1 text-[11px] uppercase tracking-wide text-gold transition hover:border-gold/40"
                          onClick={() => {
                            const nextRole =
                              c.role === 'admin' ? 'customer' : 'admin';
                            void api
                              .setCustomerRole(
                                user.accessToken,
                                c.id,
                                nextRole,
                              )
                              .then(() => api.adminCustomers(user.accessToken))
                              .then(setCustomers)
                              .then(() =>
                                setMessage(
                                  `${c.email} is now ${nextRole}.`,
                                ),
                              )
                              .catch((e: Error) => setError(e.message));
                          }}
                        >
                          Make {c.role === 'admin' ? 'customer' : 'admin'}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
                {filteredCustomers.length === 0 && (
                  <li className="px-4 py-10 text-center text-sm text-white/40">
                    No users found.
                  </li>
                )}
              </ul>
            </div>
          )}

          {soonTabs.includes(tab) && (
            <ComingSoon title={tab.charAt(0).toUpperCase() + tab.slice(1)} />
          )}
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
  );
}
