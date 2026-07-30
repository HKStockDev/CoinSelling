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

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="2.75" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.75" />
      <path d="M4 20L20 4" strokeLinecap="round" />
    </svg>
  );
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
  const [showPassword, setShowPassword] = useState(false);
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

  const title =
    mode === 'signin'
      ? 'Sign in'
      : mode === 'signup'
        ? 'Create account'
        : 'Reset password';

  const subtitle =
    mode === 'reset'
      ? 'Enter your email and we will send a reset link.'
      : mode === 'signup'
        ? 'Create an account to track orders and checkout faster.'
        : 'Track your orders and access your Empire dashboard.';

  if (loading) {
    return (
      <p className="px-4 py-24 text-center text-sm text-white/55">Loading…</p>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[calc(100svh-72px)] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10 text-gold">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <circle cx="12" cy="8" r="3.25" />
              <path d="M5.5 19.5c1.6-3.2 4-4.8 6.5-4.8s4.9 1.6 6.5 4.8" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="font-display text-4xl uppercase tracking-wide text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/55">
            {subtitle}
          </p>
        </div>

        <form
          onSubmit={onAuth}
          className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_0_0_1px_rgba(212,175,55,0.08),0_20px_60px_rgba(0,0,0,0.35)] sm:p-6"
        >
          {mode === 'signup' && (
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-white/70">Full name</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-white/12 bg-black/45 px-3.5 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-gold/45"
                placeholder="Your name"
              />
            </label>
          )}
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-white/70">Email</span>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/12 bg-black/45 px-3.5 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-gold/45"
              placeholder="you@email.com"
            />
          </label>
          {mode !== 'reset' && (
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-white/70">Password</span>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={
                    mode === 'signin' ? 'current-password' : 'new-password'
                  }
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/12 bg-black/45 px-3.5 py-3 pr-12 text-white outline-none transition placeholder:text-white/25 focus:border-gold/45"
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-white/45 transition hover:text-gold"
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </label>
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
          {info && <p className="text-sm text-green">{info}</p>}
          <button
            type="submit"
            disabled={busy}
            className="gold-btn w-full rounded-xl py-3.5 text-sm disabled:opacity-60"
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

        <div className="mt-6 space-y-3 text-center text-sm">
          {mode === 'signin' && (
            <>
              <p className="text-white/50">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  className="font-semibold text-gold transition hover:text-gold-l"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                    setInfo(null);
                    setShowPassword(false);
                  }}
                >
                  Sign up
                </button>
              </p>
              <button
                type="button"
                className="text-white/45 transition hover:text-white/75"
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
            <p className="text-white/50">
              Already registered?{' '}
              <button
                type="button"
                className="font-semibold text-gold transition hover:text-gold-l"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setInfo(null);
                  setShowPassword(false);
                }}
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase text-white">
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
