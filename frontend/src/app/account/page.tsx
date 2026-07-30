'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatGbp } from '@/lib/site';

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  total_gbp_pence: number;
  created_at: string;
  order_items?: Array<{ product_name: string; quantity: number }>;
}

export default function AccountPage() {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }
    api
      .myOrders(user.accessToken)
      .then((data) => setOrders(data as OrderRow[]))
      .catch(() => setOrders([]));
  }, [user]);

  async function onAuth(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signin') await signIn(email, password);
      else await signUp(email, password, fullName);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="px-4 py-16 text-center text-sm text-ink/60">Loading…</p>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <h1 className="font-display text-4xl text-pitch">
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </h1>
        <form onSubmit={onAuth} className="mt-8 space-y-4 border border-pitch/10 bg-white/80 p-5">
          {mode === 'signup' && (
            <label className="block text-sm">
              <span className="font-medium">Full name</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full border border-pitch/20 bg-cream px-3 py-2"
              />
            </label>
          )}
          <label className="block text-sm">
            <span className="font-medium">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-pitch/20 bg-cream px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Password</span>
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-pitch/20 bg-cream px-3 py-2"
            />
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-pitch py-2.5 text-sm font-semibold text-cream disabled:opacity-60"
          >
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <button
          type="button"
          className="mt-4 text-sm text-pitch underline"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        >
          {mode === 'signin'
            ? 'Need an account? Sign up'
            : 'Already registered? Sign in'}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-pitch">My account</h1>
          <p className="mt-2 text-sm text-ink/65">
            {user.fullName || user.email}
            {user.role === 'admin' ? ' · Admin' : ''}
          </p>
        </div>
        <div className="flex gap-3">
          {user.role === 'admin' && (
            <Link
              href="/admin"
              className="rounded-md bg-gold px-3 py-2 text-sm font-bold text-pitch-deep"
            >
              Admin panel
            </Link>
          )}
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-md border border-pitch/20 px-3 py-2 text-sm"
          >
            Sign out
          </button>
        </div>
      </div>

      <h2 className="mt-10 font-display text-2xl text-pitch">Orders</h2>
      {orders.length === 0 ? (
        <p className="mt-3 text-sm text-ink/60">No orders yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-pitch/10 border border-pitch/10 bg-white/80">
          {orders.map((order) => (
            <li key={order.id} className="px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-pitch">{order.order_number}</p>
                <p className="text-sm uppercase tracking-wide text-ink/55">
                  {order.status.replaceAll('_', ' ')}
                </p>
              </div>
              <p className="mt-1 text-sm text-ink/65">
                {formatGbp(order.total_gbp_pence)} ·{' '}
                {new Date(order.created_at).toLocaleString('en-GB')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
