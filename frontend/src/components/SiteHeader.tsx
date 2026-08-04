'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';
import { goToHomeSection } from '@/lib/scroll-section';

const HOME_SECTIONS = ['home', 'cards', 'buy', 'how-it-works'] as const;
type HomeSection = (typeof HOME_SECTIONS)[number];

const NAV = [
  {
    href: '/',
    label: 'Home',
    section: 'home' as HomeSection | null,
    match: (path: string) => path === '/',
  },
  {
    href: '/',
    label: 'Cards',
    section: 'cards' as HomeSection | null,
    match: () => false,
  },
  {
    href: '/',
    label: 'Buy',
    section: 'buy' as HomeSection | null,
    match: () => false,
  },
  {
    href: '/',
    label: 'How it works',
    section: 'how-it-works' as HomeSection | null,
    match: (path: string) => path === '/how-it-works',
  },
  {
    href: '/buy',
    label: 'Sell',
    section: null as HomeSection | null,
    match: (path: string) => path === '/buy' || path.startsWith('/buy/'),
  },
];

const NAV_LINK_ACTIVE =
  'border-b-2 border-gold pb-0.5 text-gold';
const NAV_LINK_IDLE = 'text-white/85 hover:text-gold';

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
}: {
  count: number;
  onCart: () => void;
}) {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const displayName =
    user?.fullName || user?.email?.split('@')[0] || 'Account';

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

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={user ? 'Account menu' : 'Login menu'}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-controls={menuId}
          className="relative inline-flex h-10 w-10 items-center justify-center text-gold transition hover:text-gold-l"
        >
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt=""
              className="h-7 w-7 rounded-full object-contain"
            />
          ) : (
            <UserIcon className="h-5 w-5" />
          )}
          {user && (
            <span className="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-green shadow-[0_0_6px_rgba(0,230,118,.9)]" />
          )}
        </button>

        {open && (
          <div
            id={menuId}
            role="menu"
            className="absolute right-0 top-[calc(100%+8px)] z-[80] w-56 overflow-hidden rounded-xl border border-white/10 bg-[#0f1218] py-1.5 shadow-2xl shadow-black/50"
          >
            {user ? (
              <>
                <div className="border-b border-white/8 px-3.5 py-2.5">
                  <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                  <p className="truncate text-[11px] text-white/45">{user.email}</p>
                </div>
                <Link
                  href="/account?section=settings"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-white/75 transition hover:bg-white/5 hover:text-white"
                >
                  Profile
                </Link>
                <Link
                  href="/account?section=orders"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-white/75 transition hover:bg-white/5 hover:text-white"
                >
                  Buy history
                </Link>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gold transition hover:bg-gold/10"
                  >
                    Admin panel
                  </Link>
                )}
                <div className="my-1 border-t border-white/8" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    void signOut();
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-danger transition hover:bg-danger/10"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/account?mode=signin"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-white/75 transition hover:bg-white/5 hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  href="/account?mode=signup"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gold transition hover:bg-gold/10"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { count, setDrawerOpen } = useCart();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<HomeSection>('home');

  const handleNavClick = (
    e: React.MouseEvent,
    item: (typeof NAV)[number],
  ) => {
    setMenuOpen(false);
    if (!item.section) return;
    e.preventDefault();
    if (item.section === 'home') {
      if (pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.replaceState(null, '', '/');
      } else {
        void router.push('/');
      }
      return;
    }
    goToHomeSection(item.section, pathname, (href) => {
      void router.push(href);
    });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (pathname !== '/') {
      return;
    }

    const spyOffset = 140;

    const updateActiveSection = () => {
      let current: HomeSection = 'home';
      for (const id of HOME_SECTIONS) {
        if (id === 'home') continue;
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= spyOffset) {
          current = id;
        }
      }
      setActiveSection((prev) => (prev === current ? prev : current));
    };

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);
    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, [pathname]);

  const isNavActive = (item: (typeof NAV)[number]) => {
    if (pathname === '/' && item.section) {
      return item.section === activeSection;
    }
    return item.match(pathname);
  };

  const accountHref = user
    ? user.role === 'admin'
      ? '/admin'
      : '/account?section=settings'
    : '/account?mode=signin';
  const accountLabel = user
    ? user.role === 'admin'
      ? 'Admin'
      : 'Account'
    : 'Login';

  const actions = (
    <HeaderActions count={count} onCart={() => setDrawerOpen(true)} />
  );

  return (
    <>
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
              const active = isNavActive(item);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`font-display text-[13px] uppercase tracking-[0.08em] transition ${
                    active ? NAV_LINK_ACTIVE : NAV_LINK_IDLE
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
              const active = isNavActive(item);
              return (
                <Link
                  key={`sticky-${item.label}`}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`font-display text-[12px] uppercase tracking-[0.08em] transition ${
                    active ? NAV_LINK_ACTIVE : NAV_LINK_IDLE
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
            {NAV.map((item) => {
              const active = isNavActive(item);
              return (
                <Link
                  key={`m-${item.label}`}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`font-display text-sm uppercase tracking-wide transition ${
                    active ? 'text-gold' : 'text-white/90'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
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
