'use client';

import { useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatGbp } from '@/lib/admin-dashboard';
import { PLATFORMS } from '@/lib/site';
import { useAdminShell } from '@/components/admin/AdminShell';
import {
  OrdersTable,
  computeOrderStats,
  ADMIN_ORDER_STATUSES,
  type AdminOrder,
  type OrderSortKey,
} from '@/components/admin/OrdersTable';

const STATUSES = [
  { id: '', label: 'All statuses' },
  ...ADMIN_ORDER_STATUSES.map((s) => ({ id: s.status, label: s.label })),
] as const;

type Filters = {
  orderNumber: string;
  email: string;
  name: string;
  platform: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  totalMin: string;
  totalMax: string;
};

const EMPTY_FILTERS: Filters = {
  orderNumber: '',
  email: '',
  name: '',
  platform: '',
  status: '',
  dateFrom: '',
  dateTo: '',
  totalMin: '',
  totalMax: '',
};

function orderEmail(o: AdminOrder) {
  return (o.profiles?.email ?? o.guest_email ?? '').toLowerCase();
}

function orderName(o: AdminOrder) {
  return (o.profiles?.full_name ?? '').toLowerCase();
}

function startOfDay(isoDate: string) {
  const d = new Date(`${isoDate}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function endOfDay(isoDate: string) {
  const d = new Date(`${isoDate}T23:59:59.999`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseGbpToPence(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n) || value.trim() === '') return null;
  return Math.round(n * 100);
}

function applyFilters(orders: AdminOrder[], filters: Filters, search: string) {
  const q = search.trim().toLowerCase();
  const orderNumber = filters.orderNumber.trim().toLowerCase();
  const email = filters.email.trim().toLowerCase();
  const name = filters.name.trim().toLowerCase();
  const from = filters.dateFrom ? startOfDay(filters.dateFrom) : null;
  const to = filters.dateTo ? endOfDay(filters.dateTo) : null;
  const totalMin = parseGbpToPence(filters.totalMin);
  const totalMax = parseGbpToPence(filters.totalMax);

  return orders.filter((o) => {
    if (q) {
      const hay = [
        o.order_number,
        o.status,
        o.platform,
        o.guest_email,
        o.profiles?.email,
        o.profiles?.full_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }

    if (orderNumber && !o.order_number.toLowerCase().includes(orderNumber)) return false;
    if (email && !orderEmail(o).includes(email)) return false;
    if (name && !orderName(o).includes(name)) return false;
    if (filters.platform && o.platform !== filters.platform) return false;
    if (filters.status && o.status !== filters.status) return false;

    if (from || to) {
      const created = new Date(o.created_at);
      if (Number.isNaN(created.getTime())) return false;
      if (from && created < from) return false;
      if (to && created > to) return false;
    }

    const total = o.total_gbp_pence ?? 0;
    if (totalMin != null && total < totalMin) return false;
    if (totalMax != null && total > totalMax) return false;

    return true;
  });
}

function compareOrders(a: AdminOrder, b: AdminOrder, key: OrderSortKey, dir: 'asc' | 'desc') {
  const mul = dir === 'asc' ? 1 : -1;
  let cmp = 0;

  switch (key) {
    case 'order_number':
      cmp = a.order_number.localeCompare(b.order_number, undefined, { numeric: true });
      break;
    case 'name':
      cmp = orderName(a).localeCompare(orderName(b));
      break;
    case 'email':
      cmp = orderEmail(a).localeCompare(orderEmail(b));
      break;
    case 'platform':
      cmp = a.platform.localeCompare(b.platform);
      break;
    case 'status':
      cmp = a.status.localeCompare(b.status);
      break;
    case 'date':
      cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      break;
    case 'total':
      cmp = (a.total_gbp_pence ?? 0) - (b.total_gbp_pence ?? 0);
      break;
    default:
      cmp = 0;
  }

  if (cmp === 0) {
    cmp = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }
  return cmp * mul;
}

const fieldClass =
  'mt-1 w-full rounded-lg border border-white/10 bg-[#0b0c10] px-2.5 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold/40';

export function OrdersView({ showStats = true }: { showStats?: boolean }) {
  const { user } = useAuth();
  const { search, orders, setOrders, setMessage, setError } = useAdminShell();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState<OrderSortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filteredOrders = useMemo(() => {
    const filtered = applyFilters(orders, filters, search);
    return [...filtered].sort((a, b) => compareOrders(a, b, sortKey, sortDir));
  }, [orders, filters, search, sortKey, sortDir]);

  const filteredOrderStats = useMemo(
    () => computeOrderStats(filteredOrders),
    [filteredOrders],
  );

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((v) => v.trim() !== ''),
    [filters],
  );

  function patchFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSort(key: OrderSortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir(key === 'date' || key === 'total' ? 'desc' : 'asc');
  }

  return (
    <div className="space-y-4">
      {showStats && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:hidden">
          {[
            {
              label: 'Total',
              value: String(filteredOrderStats.total),
              className: 'bg-white/[0.04] text-white ring-white/12',
            },
            {
              label: 'Paid',
              value: String(filteredOrderStats.paid),
              className: 'bg-green/10 text-green ring-green/25',
            },
            {
              label: 'Processing',
              value: String(filteredOrderStats.processing),
              className: 'bg-sky-500/10 text-sky-300 ring-sky-400/25',
            },
            {
              label: 'Complete',
              value: String(filteredOrderStats.delivered),
              className: 'bg-gold/10 text-gold ring-gold/25',
            },
            {
              label: 'Cancelled',
              value: String(filteredOrderStats.cancelled),
              className: 'bg-danger/10 text-danger ring-danger/25',
            },
            {
              label: 'Refunded',
              value: String(filteredOrderStats.refunded),
              className: 'bg-purple-500/10 text-purple-300 ring-purple-400/25',
            },
            {
              label: 'Revenue',
              value: formatGbp(filteredOrderStats.revenuePence),
              className: 'bg-gold/10 text-gold ring-gold/25',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl px-3 py-2.5 ring-1 ring-inset ${stat.className}`}
            >
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                <p className="text-[11px] font-medium opacity-70">{stat.label}</p>
              </div>
              <p className="mt-1 text-sm font-semibold tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-white/8 bg-[#12141a] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/40">
            Filters
          </p>
          <div className="flex items-center gap-3 text-xs text-white/40">
            <span>
              {filteredOrders.length} of {orders.length} order
              {orders.length === 1 ? '' : 's'}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="font-medium text-gold hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <label className="text-xs text-white/50">
            Order number
            <input
              value={filters.orderNumber}
              onChange={(e) => patchFilter('orderNumber', e.target.value)}
              placeholder="e.g. FCE-1042"
              className={fieldClass}
            />
          </label>
          <label className="text-xs text-white/50">
            Email
            <input
              type="email"
              value={filters.email}
              onChange={(e) => patchFilter('email', e.target.value)}
              placeholder="customer@email.com"
              className={fieldClass}
            />
          </label>
          <label className="text-xs text-white/50">
            Name
            <input
              value={filters.name}
              onChange={(e) => patchFilter('name', e.target.value)}
              placeholder="Customer name"
              className={fieldClass}
            />
          </label>
          <label className="text-xs text-white/50">
            Platform
            <select
              value={filters.platform}
              onChange={(e) => patchFilter('platform', e.target.value)}
              className={fieldClass}
            >
              <option value="">All platforms</option>
              {PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-white/50">
            Status
            <select
              value={filters.status}
              onChange={(e) => patchFilter('status', e.target.value)}
              className={fieldClass}
            >
              {STATUSES.map((s) => (
                <option key={s.id || 'all'} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-white/50">
            Date from
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => patchFilter('dateFrom', e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="text-xs text-white/50">
            Date to
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => patchFilter('dateTo', e.target.value)}
              className={fieldClass}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-white/50">
              Total min (£)
              <input
                type="number"
                step="0.01"
                min="0"
                value={filters.totalMin}
                onChange={(e) => patchFilter('totalMin', e.target.value)}
                placeholder="0.00"
                className={fieldClass}
              />
            </label>
            <label className="text-xs text-white/50">
              Total max (£)
              <input
                type="number"
                step="0.01"
                min="0"
                value={filters.totalMax}
                onChange={(e) => patchFilter('totalMax', e.target.value)}
                placeholder="100.00"
                className={fieldClass}
              />
            </label>
          </div>
        </div>
      </div>

      <OrdersTable
        orders={filteredOrders}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={toggleSort}
        onUpdateStatus={async (orderId, status) => {
          if (!user) return;
          try {
            await api.updateOrderStatus(user.accessToken, orderId, { status });
            const next = await api.adminOrders(user.accessToken);
            setOrders(next);
            setMessage(`Order marked ${status}.`);
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      />
    </div>
  );
}
