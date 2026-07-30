'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';

const NAV = [
  { href: '/', label: 'Home', match: (path: string) => path === '/' },
  { href: '/#cards', label: 'Cards', match: () => false },
  { href: '/#buy', label: 'Buy', match: (path: string) => path === '/buy' },
  {
    href: '/#how-it-works',
    label: 'How it works',
    match: (path: string) => path === '/how-it-works',
  },
  { href: '/buy', label: 'Sell', match: () => false },
];

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.25" />
      <path
        d="M5.5 19.5c1.6-3.2 4-4.8 6.5-4.8s4.9 1.6 6.5 4.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 576 512" className={className} fill="currentColor" aria-hidden>
      <path d="M528.12 301.319l47.273-208C578.806 78.301 567.391 64 551.99 64H111l-9.4-40.6C97.4 10.7 86.1 0 72.7 0H16C7.2 0 0 7.2 0 16s7.2 16 16 16h56.7l77.3 334.4c4.1 17.7 19.9 30.3 38.1 30.3H488c8.8 0 16-7.2 16-16s-7.2-16-16-16H188.1c-6.1 0-11.3-4.2-12.7-10.1L162.5 336H512c15.4 0 28.8-10.9 31.6-26.1zM176 464a48 48 0 1 0 96 0 48 48 0 1 0-96 0zm288 0a48 48 0 1 0 96 0 48 48 0 1 0-96 0z" />
    </svg>
  );
}

function HeaderActions({
  count,
  onCart,
  accountHref,
  accountLabel,
  loggedIn,
}: {
  count: number;
  onCart: () => void;
  accountHref: string;
  accountLabel: string;
  loggedIn: boolean;
}) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <button
        type="button"
        onClick={onCart}
        aria-label={`Open cart${count > 0 ? `, ${count} items` : ''}`}
        className="relative inline-flex h-10 w-10 items-center justify-center text-gold transition hover:text-gold-l"
      >
        <CartIcon className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 font-display text-[10px] leading-none text-black">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      <Link
        href={accountHref}
        aria-label={accountLabel}
        title={accountLabel}
        className="relative inline-flex h-10 w-10 items-center justify-center text-gold transition hover:text-gold-l"
      >
        <UserIcon className="h-5 w-5" />
        {loggedIn && (
          <span className="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-green shadow-[0_0_6px_rgba(0,230,118,.9)]" />
        )}
      </Link>
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { count, setDrawerOpen } = useCart();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const accountHref =
    user?.role === 'admin'
      ? '/admin'
      : user
        ? '/account'
        : '/account?mode=signin';

  const accountLabel = user
    ? user.role === 'admin'
      ? 'Admin'
      : 'Account'
    : 'Login';

  const actions = (
    <HeaderActions
      count={count}
      onCart={() => setDrawerOpen(true)}
      accountHref={accountHref}
      accountLabel={accountLabel}
      loggedIn={Boolean(user)}
    />
  );

  return (
    <>
      {/* Default transparent header */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="relative z-10 shrink-0">
            <Image
              src="/brand/logo-png.png"
              alt="FutCoins Empire"
              width={160}
              height={48}
              className="h-9 w-auto object-contain sm:h-11"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`font-display text-[13px] uppercase tracking-[0.08em] transition ${
                    active
                      ? 'border-b-2 border-gold pb-0.5 text-gold'
                      : 'text-white/85 hover:text-gold'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            {actions}
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center text-white lg:hidden"
              aria-label="Menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="text-xl">{menuOpen ? '×' : '☰'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sticky pill header — matches futcoinsempire.com scroll state */}
      <div
        className={`fixed left-1/2 top-5 z-[55] w-[min(1180px,calc(100%-32px))] -translate-x-1/2 transition-all duration-350 ${
          scrolled
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-6 opacity-0'
        }`}
      >
        <div className="flex items-center justify-between gap-3 rounded-full border border-white/10 bg-[rgba(8,13,14,0.82)] px-4 py-2.5 shadow-[0_20px_60px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[18px] sm:px-6 md:rounded-full">
          <Link href="/" className="shrink-0">
            <Image
              src="/brand/logo-png.png"
              alt="FutCoins Empire"
              width={140}
              height={42}
              className="h-8 w-auto object-contain sm:h-9"
            />
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={`sticky-${item.href}`}
                  href={item.href}
                  className={`font-display text-[12px] uppercase tracking-[0.08em] transition ${
                    active
                      ? 'border-b-2 border-gold pb-0.5 text-gold'
                      : 'text-white/85 hover:text-gold'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            {actions}
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center text-white lg:hidden"
              aria-label="Menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="text-xl">{menuOpen ? '×' : '☰'}</span>
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-x-0 top-[72px] z-[70] border-t border-white/10 bg-black/98 px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {NAV.map((item) => (
              <Link
                key={`m-${item.href}`}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="font-display text-sm uppercase tracking-wide text-white/90"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={accountHref}
              onClick={() => setMenuOpen(false)}
              className="font-display text-sm uppercase tracking-wide text-gold"
            >
              {accountLabel}
            </Link>
          </div>
        </div>
      )}

      <div className="h-[72px]" aria-hidden />
    </>
  );
}
