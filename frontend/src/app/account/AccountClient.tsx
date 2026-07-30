'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

export default function AccountClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, signIn, signUp, signOut, resetPassword, refresh } =
    useAuth();
  const nextPath = searchParams.get('next') || '';
  const queryMode = searchParams.get('mode');
  const queryError = searchParams.get('error');

  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(
    queryMode === 'signup' ? 'signup' : queryMode === 'reset' ? 'reset' : 'signin',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(
    queryError === 'admin_required'
      ? 'Admin access required. Sign in with an admin account.'
      : null,
  );
  const [info, setInfo] = useState<string | null>(null);
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

    if (nextPath.startsWith('/') && !nextPath.startsWith('//')) {
      if (nextPath.startsWith('/admin') && user.role !== 'admin') return;
      router.replace(nextPath);
    }
  }, [user, nextPath, router]);

  async function onAuth(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'reset') {
        await resetPassword(email);
        setInfo('Password reset email sent. Check your inbox.');
        setMode('signin');
        return;
      }
      if (mode === 'signin') await signIn(email, password);
      else await signUp(email, password, fullName);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <p className="px-4 py-24 text-center text-sm text-white/55">Loading…</p>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <p className="font-display text-xs uppercase tracking-[0.2em] text-gold">
          Account
        </p>
        <h1 className="mt-2 font-display text-4xl uppercase text-white">
          {mode === 'signin'
            ? 'Sign in'
            : mode === 'signup'
              ? 'Create account'
              : 'Reset password'}
        </h1>
        <p className="mt-2 text-sm text-white/55">
          {mode === 'reset'
            ? 'Enter your email and we will send a reset link.'
            : 'Customers track orders here. Admins unlock the dashboard after sign-in.'}
        </p>

        <form
          onSubmit={onAuth}
          className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
        >
          {mode === 'signup' && (
            <label className="block text-sm">
              <span className="font-medium text-white/80">Full name</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-gold/50"
              />
            </label>
          )}
          <label className="block text-sm">
            <span className="font-medium text-white/80">Email</span>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-gold/50"
            />
          </label>
          {mode !== 'reset' && (
            <label className="block text-sm">
              <span className="font-medium text-white/80">Password</span>
              <input
                required
                type="password"
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-gold/50"
              />
            </label>
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
          {info && <p className="text-sm text-green">{info}</p>}
          <button
            type="submit"
            disabled={busy}
            className="gold-btn w-full rounded-xl py-3 text-sm disabled:opacity-60"
          >
            {busy
              ? 'Please wait…'
              : mode === 'signin'
                ? 'Sign in'
                : mode === 'signup'
                  ? 'Create account'
                  : 'Send reset link'}
          </button>
        </form>

        <div className="mt-5 flex flex-col gap-2 text-sm text-white/60">
          {mode === 'signin' && (
            <>
              <button
                type="button"
                className="text-left text-gold underline"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setInfo(null);
                }}
              >
                Need an account? Sign up
              </button>
              <button
                type="button"
                className="text-left underline"
                onClick={() => {
                  setMode('reset');
                  setError(null);
                  setInfo(null);
                }}
              >
                Forgot password?
              </button>
            </>
          )}
          {mode !== 'signin' && (
            <button
              type="button"
              className="text-left text-gold underline"
              onClick={() => {
                setMode('signin');
                setError(null);
                setInfo(null);
              }}
            >
              Back to sign in
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.2em] text-gold">
            Account
          </p>
          <h1 className="mt-2 font-display text-4xl uppercase text-white">
            My account
          </h1>
          <p className="mt-2 text-sm text-white/60">
            {user.fullName || user.email}
            {user.role === 'admin' ? ' · Admin' : ' · Customer'}
          </p>
        </div>
        <div className="flex gap-3">
          {user.role === 'admin' && (
            <Link
              href="/admin"
              className="gold-btn rounded-xl px-4 py-2.5 text-sm"
            >
              Admin panel
            </Link>
          )}
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/80 transition hover:border-gold/40 hover:text-gold"
          >
            Sign out
          </button>
        </div>
      </div>

      <h2 className="mt-12 font-display text-2xl uppercase text-white">Orders</h2>
      {orders.length === 0 ? (
        <p className="mt-3 text-sm text-white/55">No orders yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-white/8 rounded-2xl border border-white/10 bg-white/[0.03]">
          {orders.map((order) => (
            <li key={order.id} className="px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-white">{order.order_number}</p>
                <p className="text-sm uppercase tracking-wide text-white/45">
                  {order.status.replaceAll('_', ' ')}
                </p>
              </div>
              <p className="mt-1 text-sm text-white/55">
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
