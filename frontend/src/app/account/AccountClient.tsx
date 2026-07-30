'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatGbp, SITE, whatsappUrl } from '@/lib/site';

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  total_gbp_pence: number;
  created_at: string;
  order_items?: Array<{ product_name: string; quantity: number }>;
}

type AccountSection =
  | 'settings'
  | 'orders'
  | 'help'
  | 'feedback'
  | 'invite';

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

function NavIcon({ name }: { name: string }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'orders':
      return (
        <svg {...common}>
          <circle cx="9" cy="20" r="1" />
          <circle cx="18" cy="20" r="1" />
          <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.5L21 8H7" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
        </svg>
      );
    case 'help':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 1 1 3.8 2.1c-.8.5-1.3 1-1.3 2" />
          <path d="M12 17h.01" />
        </svg>
      );
    case 'feedback':
      return (
        <svg {...common}>
          <path d="M21 14a4 4 0 0 1-4 4H9l-5 3V7a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4v7Z" />
        </svg>
      );
    case 'invite':
      return (
        <svg {...common}>
          <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7" />
          <path d="M12 16V3M8 7l4-4 4 4" />
        </svg>
      );
    default:
      return null;
  }
}

function InfoRow({
  label,
  value,
  hint,
  actionLabel,
  onAction,
  leading,
}: {
  label: string;
  value?: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
  leading?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-white/8 px-4 py-4 last:border-b-0 sm:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {leading}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{label}</p>
          {value ? (
            <p className="mt-0.5 truncate text-sm text-white/70">{value}</p>
          ) : hint ? (
            <p className="mt-0.5 text-sm text-white/40">{hint}</p>
          ) : null}
        </div>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 text-sm font-semibold text-gold transition hover:text-gold-l"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function statusTone(status: string) {
  if (status === 'delivered' || status === 'paid') return 'text-green';
  if (status === 'cancelled' || status === 'refunded') return 'text-danger';
  if (status === 'processing') return 'text-sky-300';
  return 'text-gold';
}

export default function AccountClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, signIn, signUp, signOut, resetPassword, refresh } =
    useAuth();
  const nextPath = searchParams.get('next') || '';
  const queryMode = searchParams.get('mode');
  const queryError = searchParams.get('error');
  const querySection = searchParams.get('section') as AccountSection | null;

  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(
    queryMode === 'signup' ? 'signup' : queryMode === 'reset' ? 'reset' : 'signin',
  );
  const [section, setSection] = useState<AccountSection>(
    querySection === 'orders' ||
      querySection === 'help' ||
      querySection === 'feedback' ||
      querySection === 'invite'
      ? querySection
      : 'settings',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(
    queryError === 'admin_required'
      ? 'Admin access required. Sign in with an admin account.'
      : null,
  );
  const [info, setInfo] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [editingPassword, setEditingPassword] = useState(false);
  const [passwordDraft, setPasswordDraft] = useState('');
  const [confirmPasswordDraft, setConfirmPasswordDraft] = useState('');
  const [avatarBusy, setAvatarBusy] = useState(false);

  useEffect(() => {
    if (
      querySection === 'orders' ||
      querySection === 'settings' ||
      querySection === 'help' ||
      querySection === 'feedback' ||
      querySection === 'invite'
    ) {
      setSection(querySection);
    }
  }, [querySection]);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }
    setNameDraft(user.fullName || '');
    api
      .myOrders(user.accessToken)
      .then((data) => setOrders(data as OrderRow[]))
      .catch(() => setOrders([]));

    if (nextPath.startsWith('/') && !nextPath.startsWith('//')) {
      if (nextPath.startsWith('/admin') && user.role !== 'admin') return;
      router.replace(nextPath);
    }
  }, [user, nextPath, router]);

  const spentPence = useMemo(
    () =>
      orders
        .filter((o) => ['paid', 'processing', 'delivered'].includes(o.status))
        .reduce((s, o) => s + (o.total_gbp_pence || 0), 0),
    [orders],
  );

  const initial = (user?.fullName || user?.email || 'U').trim().charAt(0).toUpperCase();
  const displayName = user?.fullName || user?.email?.split('@')[0] || 'Customer';
  const shortId = user ? `U${user.id.replace(/-/g, '').slice(0, 10).toUpperCase()}` : '';

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
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          return;
        }
        await signUp(email, password, fullName);
      } else {
        await signIn(email, password);
      }
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function saveName() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await api.updateProfile(user.accessToken, { fullName: nameDraft });
      await refresh();
      setEditingName(false);
      setInfo('Nickname updated.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function savePassword() {
    if (!user) return;
    if (passwordDraft.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (passwordDraft !== confirmPasswordDraft) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.updatePassword(user.accessToken, passwordDraft);
      setPasswordDraft('');
      setConfirmPasswordDraft('');
      setEditingPassword(false);
      setInfo('Password updated.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onAvatarSelected(file: File | null) {
    if (!user || !file) return;
    setAvatarBusy(true);
    setError(null);
    setInfo(null);
    try {
      await api.uploadAvatar(user.accessToken, file);
      await refresh();
      setInfo('Avatar updated.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAvatarBusy(false);
    }
  }

  async function onRemoveAvatar() {
    if (!user) return;
    setAvatarBusy(true);
    setError(null);
    try {
      await api.removeAvatar(user.accessToken);
      await refresh();
      setInfo('Avatar removed.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAvatarBusy(false);
    }
  }

  function goSection(next: AccountSection) {
    setSection(next);
    setInfo(null);
    setError(null);
    router.replace(`/account?section=${next}`, { scroll: false });
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
          {mode === 'signup' && (
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-white/70">
                Confirm password
              </span>
              <div className="relative">
                <input
                  required
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/12 bg-black/45 px-3.5 py-3 pr-12 text-white outline-none transition placeholder:text-white/25 focus:border-gold/45"
                  placeholder="Repeat your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={
                    showConfirmPassword
                      ? 'Hide confirm password'
                      : 'Show confirm password'
                  }
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-white/45 transition hover:text-gold"
                >
                  <EyeIcon open={showConfirmPassword} />
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
                    setShowConfirmPassword(false);
                    setConfirmPassword('');
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
                  setShowConfirmPassword(false);
                  setConfirmPassword('');
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

  const navItems: { id: AccountSection; label: string; icon: string }[] = [
    { id: 'orders', label: 'Buy history', icon: 'orders' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
    { id: 'help', label: 'Help centre', icon: 'help' },
    { id: 'feedback', label: 'Feedback', icon: 'feedback' },
    { id: 'invite', label: 'Invite for rewards', icon: 'invite' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="overflow-hidden rounded-2xl border border-white/10 bg-[#12141a]">
          <div className="border-b border-white/8 px-5 py-5">
            <div className="flex items-center gap-3">
              <div
                className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full font-display text-lg text-gold ${
                  user.avatarUrl ? 'bg-transparent' : 'bg-gold/20'
                }`}
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                ) : (
                  initial
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{displayName}</p>
                <p className="truncate text-[11px] text-white/40">{shortId}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-white/8 bg-black/25 p-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/35">Spent</p>
                <p className="mt-1 text-sm font-semibold text-gold">{formatGbp(spentPence)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/35">Orders</p>
                <p className="mt-1 text-sm font-semibold text-white">{orders.length}</p>
              </div>
            </div>
          </div>

          <nav className="p-2">
            {navItems.map((item) => {
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goSection(item.id)}
                  className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    active
                      ? 'bg-white/[0.06] text-white'
                      : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  {active && (
                    <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gold" />
                  )}
                  <span className={active ? 'text-gold' : 'text-white/40'}>
                    <NavIcon name={item.icon} />
                  </span>
                  {item.label}
                  {item.id === 'orders' && orders.length > 0 && (
                    <span className="ml-auto rounded-full bg-white/8 px-1.5 py-0.5 text-[10px] font-bold text-white/55">
                      {orders.length}
                    </span>
                  )}
                </button>
              );
            })}
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noreferrer"
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-gold transition hover:bg-gold/10"
            >
              <span className="text-gold">
                <NavIcon name="help" />
              </span>
              Earn with referrals
            </a>
          </nav>

          <div className="border-t border-white/8 p-3">
            {user.role === 'admin' && (
              <Link
                href="/admin"
                className="mb-1 flex w-full items-center justify-center rounded-xl border border-gold/30 bg-gold/10 px-3 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold/20"
              >
                Admin panel
              </Link>
            )}
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-sm text-white/50 transition hover:bg-white/5 hover:text-danger"
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* Main panel */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#12141a]">
          {(error || info) && (
            <div className="border-b border-white/8 px-5 py-3">
              {error && <p className="text-sm text-danger">{error}</p>}
              {info && <p className="text-sm text-green">{info}</p>}
            </div>
          )}

          {section === 'settings' && (
            <>
              <div className="border-b border-white/8 px-5 py-5">
                <h1 className="font-display text-2xl uppercase tracking-wide text-white">
                  Account information
                </h1>
                <p className="mt-1 text-sm text-white/45">
                  Manage your Empire profile and security.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-b border-white/8 px-4 py-4 sm:px-5">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <label className="relative cursor-pointer">
                    <span
                      className={`relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full font-display text-base text-gold ${
                        user.avatarUrl ? 'bg-transparent' : 'bg-gold/20'
                      }`}
                    >
                      {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.avatarUrl}
                          alt=""
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        initial
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-[#12141a] bg-[#12141a] text-[10px] text-white/70">
                        {avatarBusy ? '…' : '✎'}
                      </span>
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      disabled={avatarBusy}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        e.target.value = '';
                        void onAvatarSelected(file);
                      }}
                    />
                  </label>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">Avatar</p>
                    <p className="mt-0.5 text-sm text-white/40">
                      {user.avatarUrl
                        ? 'Click the pencil to replace your photo'
                        : 'Upload a photo, or initials from your nickname'}
                    </p>
                  </div>
                </div>
                {user.avatarUrl ? (
                  <button
                    type="button"
                    disabled={avatarBusy}
                    onClick={() => void onRemoveAvatar()}
                    className="shrink-0 text-sm font-semibold text-danger transition hover:text-danger/80 disabled:opacity-60"
                  >
                    Remove
                  </button>
                ) : (
                  <label className="shrink-0 cursor-pointer text-sm font-semibold text-gold transition hover:text-gold-l">
                    Upload
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      disabled={avatarBusy}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        e.target.value = '';
                        void onAvatarSelected(file);
                      }}
                    />
                  </label>
                )}
              </div>
              {editingName ? (
                <div className="flex flex-wrap items-end gap-3 border-b border-white/8 px-4 py-4 sm:px-5">
                  <label className="min-w-[200px] flex-1 text-sm">
                    <span className="mb-1.5 block font-semibold text-white">Nickname</span>
                    <input
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      className="w-full rounded-xl border border-white/12 bg-black/45 px-3 py-2.5 text-white outline-none focus:border-gold/45"
                      placeholder="Your nickname"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void saveName()}
                    className="gold-btn rounded-xl px-4 py-2.5 text-sm disabled:opacity-60"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingName(false);
                      setNameDraft(user.fullName || '');
                    }}
                    className="rounded-xl border border-white/12 px-4 py-2.5 text-sm text-white/60"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <InfoRow
                  label="Nickname"
                  value={user.fullName || 'Not set'}
                  actionLabel="Modify"
                  onAction={() => setEditingName(true)}
                />
              )}

              <InfoRow label="Email" value={user.email} hint="Bound to your Empire login" />

              {editingPassword ? (
                <div className="space-y-3 border-b border-white/8 px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="min-w-[200px] flex-1 text-sm">
                      <span className="mb-1.5 block font-semibold text-white">New password</span>
                      <input
                        type="password"
                        value={passwordDraft}
                        onChange={(e) => setPasswordDraft(e.target.value)}
                        minLength={8}
                        className="w-full rounded-xl border border-white/12 bg-black/45 px-3 py-2.5 text-white outline-none focus:border-gold/45"
                        placeholder="Min. 8 characters"
                      />
                    </label>
                    <label className="min-w-[200px] flex-1 text-sm">
                      <span className="mb-1.5 block font-semibold text-white">
                        Confirm password
                      </span>
                      <input
                        type="password"
                        value={confirmPasswordDraft}
                        onChange={(e) => setConfirmPasswordDraft(e.target.value)}
                        minLength={8}
                        className="w-full rounded-xl border border-white/12 bg-black/45 px-3 py-2.5 text-white outline-none focus:border-gold/45"
                        placeholder="Repeat your password"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void savePassword()}
                      className="gold-btn rounded-xl px-4 py-2.5 text-sm disabled:opacity-60"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPassword(false);
                        setPasswordDraft('');
                        setConfirmPasswordDraft('');
                      }}
                      className="rounded-xl border border-white/12 px-4 py-2.5 text-sm text-white/60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <InfoRow
                  label="Password"
                  hint="Keep your account secure"
                  actionLabel="Set"
                  onAction={() => setEditingPassword(true)}
                />
              )}

              <InfoRow
                label="Role"
                value={user.role === 'admin' ? 'Administrator' : 'Customer'}
              />

              <div className="border-t border-white/8 px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
                  Delivery accounts
                </p>
              </div>
              <InfoRow
                label="EA / PlayStation / Xbox"
                hint="Share your game account email at checkout for delivery"
                actionLabel="Buy coins"
                onAction={() => router.push('/buy')}
              />
            </>
          )}

          {section === 'orders' && (
            <>
              <div className="border-b border-white/8 px-5 py-5">
                <h1 className="font-display text-2xl uppercase tracking-wide text-white">
                  Buy history
                </h1>
                <p className="mt-1 text-sm text-white/45">Your recent coin orders.</p>
              </div>
              {orders.length === 0 ? (
                <div className="px-5 py-14 text-center">
                  <p className="text-sm text-white/45">No orders yet.</p>
                  <Link
                    href="/buy"
                    className="gold-btn mt-5 inline-flex rounded-xl px-5 py-2.5 text-sm"
                  >
                    Buy coins
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-white/8">
                  {orders.map((order) => (
                    <li key={order.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-white">{order.order_number}</p>
                        <p
                          className={`text-xs font-semibold uppercase tracking-wide ${statusTone(order.status)}`}
                        >
                          {order.status.replaceAll('_', ' ')}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-white/50">
                        {formatGbp(order.total_gbp_pence)} ·{' '}
                        {new Date(order.created_at).toLocaleString('en-GB')}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {section === 'help' && (
            <>
              <div className="border-b border-white/8 px-5 py-5">
                <h1 className="font-display text-2xl uppercase tracking-wide text-white">
                  Help centre
                </h1>
                <p className="mt-1 text-sm text-white/45">{SITE.supportHours}</p>
              </div>
              <div className="space-y-4 px-5 py-6 text-sm text-white/65">
                <p>
                  Need help with an order, delivery, or payment? Message our team on WhatsApp
                  for fast support.
                </p>
                <a
                  href={whatsappUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="gold-btn inline-flex rounded-xl px-5 py-2.5 text-sm"
                >
                  Chat on WhatsApp
                </a>
              </div>
            </>
          )}

          {section === 'feedback' && (
            <>
              <div className="border-b border-white/8 px-5 py-5">
                <h1 className="font-display text-2xl uppercase tracking-wide text-white">
                  Feedback
                </h1>
                <p className="mt-1 text-sm text-white/45">
                  Tell us how we can improve {SITE.name}.
                </p>
              </div>
              <div className="px-5 py-6 text-sm text-white/65">
                <p>
                  Share feedback via WhatsApp — we read every message and use it to improve
                  delivery speed and pricing.
                </p>
                <a
                  href={whatsappUrl(`Hi ${SITE.name}, I have feedback:`)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex rounded-xl border border-gold/35 px-5 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold/10"
                >
                  Send feedback
                </a>
              </div>
            </>
          )}

          {section === 'invite' && (
            <>
              <div className="border-b border-white/8 px-5 py-5">
                <h1 className="font-display text-2xl uppercase tracking-wide text-white">
                  Invite for rewards
                </h1>
                <p className="mt-1 text-sm text-white/45">
                  Share {SITE.name} with friends — rewards coming soon.
                </p>
              </div>
              <div className="px-5 py-6 text-sm text-white/65">
                <p>
                  Referral coupons are on the roadmap. For now, send friends to the store and
                  grab the best seasonal coin prices.
                </p>
                <Link
                  href="/buy"
                  className="gold-btn mt-5 inline-flex rounded-xl px-5 py-2.5 text-sm"
                >
                  Go to buy
                </Link>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
