'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SITE } from '@/lib/site';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';

const links = [
  { href: '/buy', label: 'Buy Coins' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/account', label: 'Account' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { count } = useCart();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-pitch/10 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-display text-2xl tracking-tight text-pitch">
          {SITE.name}
          <span className="text-gold">.</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'text-pitch'
                  : 'text-ink/70 hover:text-pitch'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link href="/admin" className="text-sm font-medium text-gold hover:text-pitch">
              Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            className="relative rounded-md border border-pitch/15 px-3 py-1.5 text-sm font-medium text-pitch transition hover:border-gold hover:text-pitch-deep"
          >
            Cart
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-pitch-deep">
                {count}
              </span>
            )}
          </Link>
          <Link
            href="/buy"
            className="hidden rounded-md bg-pitch px-3 py-1.5 text-sm font-semibold text-cream transition hover:bg-pitch-deep sm:inline-block"
          >
            Shop now
          </Link>
        </div>
      </div>
    </header>
  );
}
