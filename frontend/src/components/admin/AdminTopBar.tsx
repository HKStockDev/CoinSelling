'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import type { AdminTab } from '@/lib/admin-dashboard';

const TITLES: Partial<Record<AdminTab, { title: string; subtitle: string }>> = {
  dashboard: { title: 'Dashboard', subtitle: 'Store overview' },
  orders: { title: 'Orders', subtitle: 'Manage customer orders' },
  customers: { title: 'Users', subtitle: 'Customers and admins' },
  products: { title: 'Products', subtitle: 'Seasonal coin pricing' },
  coupons: { title: 'Coupons', subtitle: 'Promotions and discounts' },
  transactions: { title: 'Transactions', subtitle: 'Payment activity' },
  withdrawals: { title: 'Withdrawals', subtitle: 'Payout requests' },
  support: { title: 'Support', subtitle: 'Customer tickets' },
  settings: { title: 'Settings', subtitle: 'Store configuration' },
  logs: { title: 'System Logs', subtitle: 'Audit trail' },
  reports: { title: 'Reports', subtitle: 'Exports and analytics' },
  notifications: { title: 'Notifications', subtitle: 'Alerts centre' },
  backups: { title: 'Backups', subtitle: 'Data protection' },
};

export function AdminTopBar({
  tab,
  adminName,
  search,
  onSearch,
  onMenu,
  onLogout,
  notificationCount = 0,
}: {
  tab: AdminTab;
  adminName: string;
  search: string;
  onSearch: (v: string) => void;
  onMenu: () => void;
  onLogout: () => void;
  notificationCount?: number;
}) {
  const meta = TITLES[tab] ?? { title: 'Admin', subtitle: '' };
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="z-30 flex h-16 shrink-0 items-center gap-3 border-b border-white/8 bg-[#0b0c10] px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenu}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/80 lg:hidden"
        aria-label="Open menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <div className="min-w-0 shrink-0">
        <h1 className="font-display text-base leading-tight text-white sm:text-lg">{meta.title}</h1>
        <p className="hidden text-xs leading-tight text-white/45 sm:block">{meta.subtitle}</p>
      </div>

      <div className="mx-2 hidden min-w-0 flex-1 items-center md:flex lg:mx-8">
        <label className="relative flex w-full max-w-xl items-center">
          <svg
            className="pointer-events-none absolute left-3 text-white/35"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search users, orders, transactions…"
            className="w-full rounded-full border border-white/10 bg-[#14161c] py-2 pl-10 pr-16 text-sm text-white outline-none placeholder:text-white/35 focus:border-gold/40"
          />
          <kbd className="pointer-events-none absolute right-3 hidden rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40 sm:inline">
            CTRL + K
          </kbd>
        </label>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/70"
          aria-label="Theme"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5Z" />
          </svg>
        </button>
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/70"
          aria-label="Notifications"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 7H3s3 0 3-7" />
            <path d="M10 19a2 2 0 0 0 4 0" />
          </svg>
          {notificationCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-controls={menuId}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] py-1 pl-1 pr-2 transition hover:border-white/20 hover:bg-white/[0.05] sm:pr-2.5"
          >
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gold/20 text-gold">
              <Image src="/brand/favi.png" alt="" width={32} height={32} className="h-8 w-8 object-cover" />
            </div>
            <div className="hidden leading-tight sm:block">
              <p className="text-left text-sm font-semibold text-white">{adminName || 'Admin'}</p>
              <p className="text-left text-[11px] text-white/45">Administrator</p>
            </div>
            <svg
              className={`text-white/45 transition ${menuOpen ? 'rotate-180' : ''}`}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {menuOpen && (
            <div
              id={menuId}
              role="menu"
              className="absolute right-0 top-[calc(100%+6px)] z-50 w-48 overflow-hidden rounded-lg border border-white/10 bg-[#12141a] py-1 shadow-xl shadow-black/40"
            >
              <Link
                href="/account"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 19a7 7 0 0 1 14 0" />
                </svg>
                Account
              </Link>
              <Link
                href="/"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M14 4h6v6" />
                  <path d="M10 14 20 4" />
                  <path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" />
                </svg>
                View store
              </Link>
              <div className="my-1 border-t border-white/8" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-danger transition hover:bg-danger/10"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="M16 17l5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
