'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { AdminTab } from '@/lib/admin-dashboard';
import { SITE } from '@/lib/site';

const MAIN: { id: AdminTab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home' },
  { id: 'orders', label: 'Orders', icon: 'cart' },
  { id: 'customers', label: 'Users', icon: 'users' },
  { id: 'products', label: 'Products', icon: 'box' },
  { id: 'coupons', label: 'Coupons', icon: 'ticket' },
  { id: 'transactions', label: 'Transactions', icon: 'card' },
  { id: 'withdrawals', label: 'Withdrawals', icon: 'cash' },
  { id: 'support', label: 'Support', icon: 'chat' },
  { id: 'settings', label: 'Settings', icon: 'gear' },
];

const TOOLS: { id: AdminTab; label: string; icon: string }[] = [
  { id: 'logs', label: 'System Logs', icon: 'list' },
  { id: 'reports', label: 'Reports', icon: 'chart' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'backups', label: 'Backups', icon: 'backup' },
];

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
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5 10.5V20h14v-9.5" />
        </svg>
      );
    case 'cart':
      return (
        <svg {...common}>
          <circle cx="9" cy="20" r="1" />
          <circle cx="18" cy="20" r="1" />
          <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.5L21 8H7" />
        </svg>
      );
    case 'users':
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 19a6.5 6.5 0 0 1 13 0" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M16 19a5 5 0 0 1 5.5-4.7" />
        </svg>
      );
    case 'box':
      return (
        <svg {...common}>
          <path d="M12 3 3 7.5 12 12l9-4.5L12 3Z" />
          <path d="M3 7.5V16.5L12 21l9-4.5V7.5" />
          <path d="M12 12v9" />
        </svg>
      );
    case 'ticket':
      return (
        <svg {...common}>
          <path d="M3 9a2 2 0 0 0 2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1a2 2 0 1 0 0 4v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2Z" />
          <path d="M10 8v8" />
        </svg>
      );
    case 'card':
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18" />
        </svg>
      );
    case 'cash':
      return (
        <svg {...common}>
          <path d="M12 3v18" />
          <path d="M16 7.5c0-1.7-1.8-3-4-3s-4 1.3-4 3 1.8 3 4 3 4 1.3 4 3-1.8 3-4 3-4-1.3-4-3" />
        </svg>
      );
    case 'chat':
      return (
        <svg {...common}>
          <path d="M21 14a4 4 0 0 1-4 4H9l-5 3V7a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4v7Z" />
        </svg>
      );
    case 'gear':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
        </svg>
      );
    case 'list':
      return (
        <svg {...common}>
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...common}>
          <path d="M4 19V5M4 19h16" />
          <path d="M8 16V10M12 16V7M16 16v-4" />
        </svg>
      );
    case 'bell':
      return (
        <svg {...common}>
          <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 7H3s3 0 3-7" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
      );
    case 'backup':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M10 9.5 15 12l-5 2.5V9.5Z" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return null;
  }
}

export function AdminSidebar({
  tab,
  onSelect,
  open,
  onClose,
}: {
  tab: AdminTab;
  onSelect: (tab: AdminTab) => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-white/8 bg-[#0b0c10] transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/8 px-5">
          <Image
            src="/brand/logo-png.png"
            alt={SITE.name}
            width={140}
            height={40}
            className="h-9 w-auto object-contain"
            priority
          />
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
            Main menu
          </p>
          <ul className="space-y-0.5">
            {MAIN.map((item) => {
              const active = tab === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(item.id);
                      onClose();
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                      active
                        ? 'bg-gold/12 text-gold shadow-[inset_0_0_0_1px_rgba(212,175,55,0.35)]'
                        : 'text-white/65 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className={active ? 'text-gold' : 'text-white/45'}>
                      <NavIcon name={item.icon} />
                    </span>
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
            Tools
          </p>
          <ul className="space-y-0.5">
            {TOOLS.map((item) => {
              const active = tab === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(item.id);
                      onClose();
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                      active
                        ? 'bg-gold/12 text-gold shadow-[inset_0_0_0_1px_rgba(212,175,55,0.35)]'
                        : 'text-white/65 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className={active ? 'text-gold' : 'text-white/45'}>
                      <NavIcon name={item.icon} />
                    </span>
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
            Store
          </p>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/65 transition hover:bg-white/5 hover:text-white"
          >
            <span className="text-white/45">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M14 4h6v6" />
                <path d="M10 14 20 4" />
                <path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" />
              </svg>
            </span>
            View store
          </Link>
        </nav>

        <div className="shrink-0 border-t border-white/8 px-5 py-4 text-[11px] text-white/35">
          {SITE.name} Admin · v2.1.0
        </div>
      </aside>
    </>
  );
}
