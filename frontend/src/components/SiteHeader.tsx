'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/lib/cart';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/#cards', label: 'Cards' },
  { href: '/#buy', label: 'Buy' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/buy', label: 'Sell' },
];

export function SiteHeader() {
  const { count, setDrawerOpen } = useCart();
  const [visible, setVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 100);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
        visible
          ? 'border-gold/20 bg-black/95 shadow-[0_8px_32px_rgba(0,0,0,.55)] backdrop-blur-md'
          : 'border-transparent bg-gradient-to-b from-black/80 to-transparent'
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="relative z-10 shrink-0">
          <Image
            src="/brand/logo-png.png"
            alt="FutCoins Empire"
            width={160}
            height={48}
            className="h-10 w-auto object-contain sm:h-12"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-display text-[13px] uppercase tracking-[0.08em] text-white/85 transition hover:text-gold"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={`Open cart${count > 0 ? `, ${count} items` : ''}`}
            className="relative inline-flex h-10 w-10 items-center justify-center text-gold transition hover:text-gold-l"
          >
            <svg
              viewBox="0 0 576 512"
              className="h-5 w-5 fill-current"
              aria-hidden
            >
              <path d="M528.12 301.319l47.273-208C578.806 78.301 567.391 64 551.99 64H111l-9.4-40.6C97.4 10.7 86.1 0 72.7 0H16C7.2 0 0 7.2 0 16s7.2 16 16 16h56.7l77.3 334.4c4.1 17.7 19.9 30.3 38.1 30.3H488c8.8 0 16-7.2 16-16s-7.2-16-16-16H188.1c-6.1 0-11.3-4.2-12.7-10.1L162.5 336H512c15.4 0 28.8-10.9 31.6-26.1zM176 464a48 48 0 1 0 96 0 48 48 0 1 0-96 0zm288 0a48 48 0 1 0 96 0 48 48 0 1 0-96 0z" />
            </svg>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 font-display text-[10px] leading-none text-black">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white lg:hidden"
            aria-label="Menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="text-xl">{menuOpen ? '×' : '☰'}</span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-white/10 bg-black/98 px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="font-display text-sm uppercase tracking-wide text-white/90"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
