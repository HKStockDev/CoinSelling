'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { formatGbp, platformMeta } from '@/lib/admin-dashboard';

export type AdminOrder = {
  id: string;
  order_number: string;
  user_id?: string | null;
  status: string;
  total_gbp_pence: number;
  platform: string;
  created_at: string;
  guest_email: string | null;
  profiles?: { email: string; full_name: string | null } | null;
  order_items?: Array<{ product_name: string; quantity: number }>;
};

export type OrderSortKey =
  | 'order_number'
  | 'name'
  | 'email'
  | 'platform'
  | 'status'
  | 'date'
  | 'total';

/** Admin-facing order statuses (DB value → UI label). */
export const ADMIN_ORDER_STATUSES = [
  { status: 'paid', label: 'Paid' },
  { status: 'processing', label: 'Processing' },
  { status: 'delivered', label: 'Complete' },
  { status: 'cancelled', label: 'Cancelled' },
  { status: 'refunded', label: 'Refunded' },
] as const;

/** Selectable statuses in the Status dropdown. */
const STATUS_OPTIONS = ADMIN_ORDER_STATUSES;

export function orderStatusStyle(status: string) {
  switch (status) {
    case 'pending_payment':
      return {
        label: 'Pending payment',
        className: 'bg-amber-500/15 text-amber-300 ring-amber-400/25',
      };
    case 'paid':
      return {
        label: 'Paid',
        className: 'bg-green/15 text-green ring-green/30',
      };
    case 'processing':
      return {
        label: 'Processing',
        className: 'bg-sky-500/15 text-sky-300 ring-sky-400/30',
      };
    case 'delivered':
      return {
        label: 'Complete',
        className: 'bg-gold/15 text-gold ring-gold/30',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        className: 'bg-danger/15 text-danger ring-danger/30',
      };
    case 'refunded':
      return {
        label: 'Refunded',
        className: 'bg-purple-500/15 text-purple-300 ring-purple-400/25',
      };
    default:
      return {
        label: status.replaceAll('_', ' '),
        className: 'bg-white/8 text-white/60 ring-white/15',
      };
  }
}

export function OrderStatusBadge({ status }: { status: string }) {
  const meta = orderStatusStyle(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${meta.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {meta.label}
    </span>
  );
}

function StatusDropdown({
  status,
  onSelect,
}: {
  status: string;
  onSelect: (next: string) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const meta = orderStatusStyle(status);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset transition hover:brightness-110 ${meta.className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
        {meta.label}
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`opacity-70 transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Order status"
          className="absolute left-0 z-30 mt-1.5 min-w-[9.5rem] overflow-hidden rounded-lg border border-white/10 bg-[#1a1d24] py-1 shadow-xl"
        >
          {STATUS_OPTIONS.map((opt) => {
            const active = status === opt.status;
            const optMeta = orderStatusStyle(opt.status);
            return (
              <li key={opt.status} role="option" aria-selected={active}>
                <button
                  type="button"
                  disabled={active}
                  onClick={() => {
                    setOpen(false);
                    if (!active) void onSelect(opt.status);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition ${
                    active
                      ? 'cursor-default bg-white/8 text-white/40'
                      : `${optMeta.className.split(' ').find((c) => c.startsWith('text-')) ?? 'text-white/80'} hover:bg-white/8`
                  }`}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80" />
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export function computeOrderStats(orders: AdminOrder[]) {
  const count = (status: string) => orders.filter((o) => o.status === status).length;
  const revenue = orders
    .filter((o) => ['paid', 'processing', 'delivered'].includes(o.status))
    .reduce((s, o) => s + (o.total_gbp_pence ?? 0), 0);
  return {
    total: orders.length,
    paid: count('paid'),
    processing: count('processing'),
    delivered: count('delivered'),
    cancelled: count('cancelled'),
    refunded: count('refunded'),
    pending: count('pending_payment'),
    revenuePence: revenue,
    /** New / unread work queue */
    newCount: count('paid') + count('processing'),
  };
}

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function SortHeader({
  label,
  column,
  sortKey,
  sortDir,
  onSort,
  align = 'left',
}: {
  label: string;
  column: OrderSortKey;
  sortKey: OrderSortKey;
  sortDir: 'asc' | 'desc';
  onSort: (key: OrderSortKey) => void;
  align?: 'left' | 'right';
}) {
  const active = sortKey === column;
  return (
    <th className={`px-4 py-3 font-semibold ${align === 'right' ? 'text-right' : ''}`}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`inline-flex items-center gap-1 uppercase tracking-[0.12em] transition hover:text-white ${
          align === 'right' ? 'flex-row-reverse' : ''
        } ${active ? 'text-gold' : 'text-white/40'}`}
      >
        {label}
        <span className="inline-flex w-3 justify-center text-[11px]" aria-hidden>
          {active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </th>
  );
}

export function OrdersTable({
  orders,
  onUpdateStatus,
  sortKey = 'date',
  sortDir = 'desc',
  onSort,
}: {
  orders: AdminOrder[];
  onUpdateStatus: (orderId: string, status: string) => void | Promise<void>;
  sortKey?: OrderSortKey;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: OrderSortKey) => void;
}) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-white/8 bg-[#12141a] px-4 py-12 text-center text-sm text-white/40">
        No orders found.
      </div>
    );
  }

  const handleSort = onSort ?? (() => undefined);

  return (
    <div className="animate-rise overflow-hidden rounded-xl border border-white/8 bg-[#12141a]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/8 bg-white/[0.02] text-[11px]">
              <SortHeader
                label="Order"
                column="order_number"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortHeader
                label="Customer"
                column="name"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortHeader
                label="Platform"
                column="platform"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortHeader
                label="Status"
                column="status"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortHeader
                label="Date"
                column="date"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortHeader
                label="Total"
                column="total"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                align="right"
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6">
            {orders.map((order) => {
              const meta = platformMeta(order.platform);
              const email =
                order.profiles?.email ?? order.guest_email ?? 'guest';
              const name = order.profiles?.full_name;
              return (
                <tr
                  key={order.id}
                  className="transition hover:bg-white/[0.025]"
                >
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-white">{order.order_number}</p>
                    <p className="mt-0.5 text-[11px] text-white/35">
                      {(order.order_items?.length ?? 0) || '—'} item
                      {(order.order_items?.length ?? 0) === 1 ? '' : 's'}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-white/85">{name || '—'}</p>
                    <p className="mt-0.5 text-xs text-white/45">{email}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <img
                        src={meta.icon}
                        alt=""
                        width={22}
                        height={22}
                        className="h-[22px] w-[22px] object-contain"
                      />
                      <span className="text-white/70">{meta.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusDropdown
                      status={order.status}
                      onSelect={(next) => onUpdateStatus(order.id, next)}
                    />
                  </td>
                  <td className="px-4 py-3.5 text-xs text-white/45">
                    {formatWhen(order.created_at)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-gold">
                    {formatGbp(order.total_gbp_pence)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
