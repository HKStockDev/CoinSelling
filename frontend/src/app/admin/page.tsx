'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatCoins, formatGbp, PLATFORMS, type Platform, type Product } from '@/lib/site';

type Tab = 'prices' | 'orders' | 'customers' | 'dashboard';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>('prices');
  const [platform, setPlatform] = useState<Platform>('ps4_ps5');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<
    Awaited<ReturnType<typeof api.adminOrders>>
  >([]);
  const [customers, setCustomers] = useState<
    Awaited<ReturnType<typeof api.adminCustomers>>
  >([]);
  const [dashboard, setDashboard] = useState<Record<string, unknown> | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const token = user.accessToken;
    if (tab === 'prices') {
      api
        .adminProducts(token, platform)
        .then(setProducts)
        .catch((e: Error) => setError(e.message));
    }
    if (tab === 'orders') {
      api
        .adminOrders(token)
        .then(setOrders)
        .catch((e: Error) => setError(e.message));
    }
    if (tab === 'customers') {
      api
        .adminCustomers(token)
        .then(setCustomers)
        .catch((e: Error) => setError(e.message));
    }
    if (tab === 'dashboard') {
      api
        .adminDashboard(token)
        .then(setDashboard)
        .catch((e: Error) => setError(e.message));
    }
  }, [user, tab, platform]);

  if (loading) {
    return <p className="px-4 py-16 text-center text-sm">Loading…</p>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-3xl text-pitch">Admin</h1>
        <p className="mt-2 text-sm text-ink/65">Sign in with an admin account.</p>
        <Link href="/account" className="mt-4 inline-block text-gold underline">
          Go to account
        </Link>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-3xl text-pitch">Access denied</h1>
        <p className="mt-2 text-sm text-ink/65">
          Your account is not an admin. Promote a profile role to admin in Supabase.
        </p>
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl text-pitch">Admin</h1>
      <p className="mt-2 text-sm text-ink/65">
        Manage seasonal prices, orders and customers.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ['prices', 'Prices'],
            ['orders', 'Orders'],
            ['customers', 'Customers'],
            ['dashboard', 'Dashboard'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id);
              setError(null);
              setMessage(null);
            }}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
              tab === id ? 'bg-pitch text-cream' : 'border border-pitch/20'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {message && <p className="mt-4 text-sm text-pitch">{message}</p>}
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      {tab === 'prices' && (
        <div className="mt-8">
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatform(p.id)}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  platform === p.id
                    ? 'bg-gold text-pitch-deep font-bold'
                    : 'border border-pitch/15'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="mt-6 space-y-4">
            {products.map((product) => (
              <form
                key={product.id}
                onSubmit={(e) => void savePrice(e, product)}
                className="grid gap-3 border border-pitch/10 bg-white/80 p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:items-end"
              >
                <div>
                  <p className="font-semibold text-pitch">
                    {formatCoins(product.coin_amount)} · {product.name}
                  </p>
                  <p className="text-xs text-ink/50">{product.slug}</p>
                </div>
                <label className="text-xs">
                  Price (GBP)
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    defaultValue={(product.price_gbp_pence / 100).toFixed(2)}
                    className="mt-1 w-full border border-pitch/20 bg-cream px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="text-xs">
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
                    className="mt-1 w-full border border-pitch/20 bg-cream px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="text-xs">
                  Note
                  <input
                    name="note"
                    defaultValue="Seasonal update"
                    className="mt-1 w-full border border-pitch/20 bg-cream px-2 py-1.5 text-sm"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-md bg-pitch px-3 py-2 text-sm font-semibold text-cream"
                >
                  Save
                </button>
              </form>
            ))}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <ul className="mt-8 divide-y divide-pitch/10 border border-pitch/10 bg-white/80">
          {orders.map((order) => (
            <li key={order.id} className="space-y-2 px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-pitch">{order.order_number}</p>
                <p className="text-sm">{formatGbp(order.total_gbp_pence)}</p>
              </div>
              <p className="text-sm text-ink/65">
                {order.status} · {order.platform} ·{' '}
                {order.profiles?.email ?? order.guest_email ?? 'guest'}
              </p>
              <div className="flex flex-wrap gap-2">
                {['paid', 'processing', 'delivered', 'cancelled'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="rounded border border-pitch/15 px-2 py-1 text-xs capitalize"
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
          ))}
        </ul>
      )}

      {tab === 'customers' && (
        <ul className="mt-8 divide-y divide-pitch/10 border border-pitch/10 bg-white/80">
          {customers.map((c) => (
            <li key={c.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
              <span>
                {c.full_name || '—'} · {c.email}
              </span>
              <span className="uppercase tracking-wide text-ink/50">{c.role}</span>
            </li>
          ))}
        </ul>
      )}

      {tab === 'dashboard' && dashboard && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              { label: 'Products', value: String(dashboard.productCount ?? 0) },
              { label: 'Orders', value: String(dashboard.orderCount ?? 0) },
              { label: 'Customers', value: String(dashboard.customerCount ?? 0) },
              {
                label: 'Paid revenue',
                value: formatGbp(Number(dashboard.paidRevenueGbpPence ?? 0)),
              },
            ] as const
          ).map((stat) => (
            <div key={stat.label} className="border border-pitch/10 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-wide text-ink/50">{stat.label}</p>
              <p className="mt-2 font-display text-3xl text-pitch">{stat.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
