'use client';

import Image from 'next/image';
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
  notificationCount = 0,
}: {
  tab: AdminTab;
  adminName: string;
  search: string;
  onSearch: (v: string) => void;
  onMenu: () => void;
  notificationCount?: number;
}) {
  const meta = TITLES[tab] ?? { title: 'Admin', subtitle: '' };

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b border-white/8 bg-[#0b0c10]/95 px-4 py-3 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={onMenu}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white/80 lg:hidden"
        aria-label="Open menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <div className="min-w-0">
        <h1 className="font-display text-lg text-white sm:text-xl">{meta.title}</h1>
        <p className="text-xs text-white/45">{meta.subtitle}</p>
      </div>

      <div className="order-last flex w-full flex-1 items-center sm:order-none sm:mx-4 sm:max-w-xl lg:mx-8">
        <label className="relative flex w-full items-center">
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
            className="w-full rounded-full border border-white/10 bg-[#14161c] py-2.5 pl-10 pr-16 text-sm text-white outline-none placeholder:text-white/35 focus:border-gold/40"
          />
          <kbd className="pointer-events-none absolute right-3 hidden rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40 sm:inline">
            CTRL + K
          </kbd>
        </label>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white/70"
          aria-label="Theme"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5Z" />
          </svg>
        </button>
        <button
          type="button"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white/70"
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
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] py-1.5 pl-1.5 pr-3">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gold/20 text-gold">
            <Image src="/brand/favi.png" alt="" width={32} height={32} className="h-8 w-8 object-cover" />
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-semibold text-white">{adminName || 'Admin'}</p>
            <p className="text-[11px] text-white/45">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}
