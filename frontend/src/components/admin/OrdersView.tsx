'use client';

import { useMemo } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatGbp } from '@/lib/admin-dashboard';
import { useAdminShell } from '@/components/admin/AdminShell';
import { OrdersTable, computeOrderStats } from '@/components/admin/OrdersTable';

export function OrdersView({ showStats = true }: { showStats?: boolean }) {
  const { user } = useAuth();
  const { search, orders, setOrders, setMessage, setError } = useAdminShell();

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
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
      return hay.includes(q);
    });
  }, [orders, search]);

  const filteredOrderStats = useMemo(
    () => computeOrderStats(filteredOrders),
    [filteredOrders],
  );

  return (
    <div className="space-y-4">
      {showStats && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:hidden">
          {[
            { label: 'Total', value: String(filteredOrderStats.total), tone: 'text-white' },
            { label: 'Paid', value: String(filteredOrderStats.paid), tone: 'text-green' },
            {
              label: 'Processing',
              value: String(filteredOrderStats.processing),
              tone: 'text-sky-300',
            },
            {
              label: 'Delivered',
              value: String(filteredOrderStats.delivered),
              tone: 'text-gold',
            },
            {
              label: 'Cancelled',
              value: String(filteredOrderStats.cancelled),
              tone: 'text-danger',
            },
            {
              label: 'Revenue',
              value: formatGbp(filteredOrderStats.revenuePence),
              tone: 'text-gold',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/8 bg-[#12141a] px-3 py-2.5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
                {stat.label}
              </p>
              <p className={`mt-1 text-sm font-semibold ${stat.tone}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}
      <OrdersTable
        orders={filteredOrders}
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
