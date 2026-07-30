'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/lib/cart';
import { formatGbp } from '@/lib/site';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/#cards', label: 'Cards' },
  { href: '/#buy', label: 'Buy' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/buy', label: 'Sell' },
];

export function SiteHeader() {
  const { count, totalPence, setDrawerOpen } = useCart();
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
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:border-gold/40"
          >
            <span className="font-display text-gold">{formatGbp(totalPence)}</span>
            <span className="text-white/70">{count} Cart</span>
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
