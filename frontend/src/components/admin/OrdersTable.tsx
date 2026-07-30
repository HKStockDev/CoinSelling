'use client';

import { formatGbp, platformMeta } from '@/lib/admin-dashboard';

export type AdminOrder = {
  id: string;
  order_number: string;
  status: string;
  total_gbp_pence: number;
  platform: string;
  created_at: string;
  guest_email: string | null;
  profiles?: { email: string; full_name: string | null } | null;
  order_items?: Array<{ product_name: string; quantity: number }>;
};

const STATUS_ACTIONS = [
  {
    status: 'paid',
    label: 'Mark Paid',
    className: 'text-green hover:bg-green/15 hover:border-green/40',
    icon: 'paid',
  },
  {
    status: 'processing',
    label: 'Mark Processing',
    className: 'text-sky-400 hover:bg-sky-400/15 hover:border-sky-400/40',
    icon: 'processing',
  },
  {
    status: 'delivered',
    label: 'Mark Delivered',
    className: 'text-gold hover:bg-gold/15 hover:border-gold/40',
    icon: 'delivered',
  },
  {
    status: 'cancelled',
    label: 'Mark Cancelled',
    className: 'text-danger hover:bg-danger/15 hover:border-danger/40',
    icon: 'cancelled',
  },
] as const;

function StatusIcon({ name }: { name: string }) {
  const common = {
    width: 15,
    height: 15,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'paid':
      return (
        <svg {...common}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    case 'processing':
      return (
        <svg {...common}>
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
          <circle cx="12" cy="12" r="3.5" />
        </svg>
      );
    case 'delivered':
      return (
        <svg {...common}>
          <path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="M3.3 7 12 12l8.7-5M12 22V12" />
        </svg>
      );
    case 'cancelled':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m9 9 6 6M15 9l-6 6" />
        </svg>
      );
    default:
      return null;
  }
}

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
        label: 'Delivered',
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
    cancelled: count('cancelled') + count('refunded'),
    pending: count('pending_payment'),
    revenuePence: revenue,
    /** New / unread work queue */
    newCount: count('paid') + count('pending_payment'),
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

export function OrdersTable({
  orders,
  onUpdateStatus,
}: {
  orders: AdminOrder[];
  onUpdateStatus: (orderId: string, status: string) => void | Promise<void>;
}) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-white/8 bg-[#12141a] px-4 py-12 text-center text-sm text-white/40">
        No orders found.
      </div>
    );
  }

  return (
    <div className="animate-rise overflow-hidden rounded-xl border border-white/8 bg-[#12141a]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/8 bg-white/[0.02] text-[11px] uppercase tracking-[0.12em] text-white/40">
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Platform</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 text-right font-semibold">Total</th>
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
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#0b0c10]/60 p-1">
                      {STATUS_ACTIONS.map((action) => {
                        const active = order.status === action.status;
                        return (
                          <button
                            key={action.status}
                            type="button"
                            title={action.label}
                            aria-label={action.label}
                            disabled={active}
                            onClick={() =>
                              void onUpdateStatus(order.id, action.status)
                            }
                            className={`group relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent transition ${
                              active
                                ? 'cursor-default bg-white/8 text-white/35'
                                : action.className
                            }`}
                          >
                            <StatusIcon name={action.icon} />
                            <span className="pointer-events-none absolute left-1/2 top-[calc(100%+6px)] z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[#1a1d24] px-2 py-1 text-[10px] font-medium text-white shadow-lg group-hover:block group-focus-visible:block">
                              {action.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
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
