'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  formatGbp,
  platformMeta,
  type AdminDashboardData,
  type AdminTab,
} from '@/lib/admin-dashboard';
import { formatCoins, PLATFORMS, type Platform, type Product } from '@/lib/site';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { ComingSoon, DashboardView } from '@/components/admin/DashboardView';

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
        if (tab === 'dashboard') {
          const data = await api.adminDashboard(token);
          if (!cancelled) setDashboard(data);
        }
        if (tab === 'products') {
          const data = await api.adminProducts(token, platform);
          if (!cancelled) setProducts(data);
        }
        if (tab === 'orders' || tab === 'transactions') {
          const data = await api.adminOrders(token);
          if (!cancelled) setOrders(data);
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
            href="/account"
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
            Your account is not an admin. Promote a profile role to admin in Supabase.
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
    <div className="flex min-h-screen bg-[#0b0c10] text-white">
      <AdminSidebar
        tab={tab}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={(next) => {
          setTab(next);
          setMessage(null);
          setError(null);
        }}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar
          tab={tab}
          adminName={user.fullName || user.email.split('@')[0] || 'Admin'}
          search={search}
          onSearch={setSearch}
          onMenu={() => setSidebarOpen(true)}
          notificationCount={dashboard?.bottom.pendingCount ?? 0}
        />

        <div className="flex-1 overflow-auto px-4 py-5 sm:px-6">
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
            <div className="animate-rise overflow-hidden rounded-xl border border-white/8 bg-[#12141a]">
              <ul className="divide-y divide-white/6">
                {filteredOrders.map((order) => {
                  const meta = platformMeta(order.platform);
                  return (
                    <li key={order.id} className="space-y-3 px-4 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={meta.icon}
                            alt={meta.label}
                            width={28}
                            height={28}
                            className="h-7 w-7 object-contain"
                          />
                          <div>
                            <p className="font-semibold text-white">{order.order_number}</p>
                            <p className="text-sm text-white/50">
                              {order.status} · {meta.label} ·{' '}
                              {order.profiles?.email ?? order.guest_email ?? 'guest'}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-gold">
                          {formatGbp(order.total_gbp_pence)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {['paid', 'processing', 'delivered', 'cancelled'].map((status) => (
                          <button
                            key={status}
                            type="button"
                            className="rounded-lg border border-white/10 px-2.5 py-1 text-xs capitalize text-white/70 hover:border-gold/40 hover:text-gold"
                            onClick={() =>
                              void api
                                .updateOrderStatus(user.accessToken, order.id, { status })
                                .then(() => api.adminOrders(user.accessToken))
                                .then(setOrders)
                                .catch((e: Error) => setError(e.message))
                            }
                          >
                            Mark {status}
                          </button>
                        ))}
                      </div>
                    </li>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <li className="px-4 py-10 text-center text-sm text-white/40">
                    No orders found.
                  </li>
                )}
              </ul>
            </div>
          )}

          {tab === 'customers' && (
            <div className="animate-rise overflow-hidden rounded-xl border border-white/8 bg-[#12141a]">
              <ul className="divide-y divide-white/6">
                {filteredCustomers.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                  >
                    <span>
                      <span className="font-medium text-white">{c.full_name || '—'}</span>
                      <span className="text-white/45"> · {c.email}</span>
                    </span>
                    <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] uppercase tracking-wide text-white/50">
                      {c.role}
                    </span>
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

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/8 px-4 py-3 text-[11px] text-white/35 sm:px-6">
          <span>FutCoins Empire Admin Panel v2.1.0</span>
          <div className="flex items-center gap-4">
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
