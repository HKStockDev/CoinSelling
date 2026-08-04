'use client';

import {
  formatGbp,
  formatSold,
  platformMeta,
  productDisplayName,
  type AdminDashboardData,
} from '@/lib/admin-dashboard';
import { PlatformDonut, SalesOrdersChart, Sparkline } from './charts';

function ChangeBadge({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${up ? 'text-green' : 'text-danger'}`}>
      <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
        {up ? <path d="M6 2 11 9H1L6 2Z" /> : <path d="M6 10 1 3h10L6 10Z" />}
      </svg>
      {Math.abs(value)}% vs prior period
    </span>
  );
}

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-white/8 bg-[#12141a] ${className}`}>
      {children}
    </div>
  );
}

function StatusPill({ tone, label }: { tone: 'paid' | 'pending' | 'cancelled'; label: string }) {
  const styles = {
    paid: 'bg-green/15 text-green',
    pending: 'bg-gold/15 text-gold',
    cancelled: 'bg-danger/15 text-danger',
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${styles[tone]}`}>
      {label}
    </span>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const styles: Record<string, string> = {
    user: 'bg-violet-500/15 text-violet-300 ring-1 ring-inset ring-violet-400/25',
    order: 'bg-green/15 text-green ring-1 ring-inset ring-green/30',
    product: 'bg-gold/15 text-gold ring-1 ring-inset ring-gold/30',
    system: 'bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-400/25',
  };
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  let icon: React.ReactNode;
  switch (type) {
    case 'user':
      icon = (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="3.5" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a3.5 3.5 0 0 1 0 6.74" />
        </svg>
      );
      break;
    case 'order':
      icon = (
        <svg {...common}>
          <circle cx="9" cy="20" r="1.4" />
          <circle cx="18" cy="20" r="1.4" />
          <path d="M3 4h2l1.6 9.2a2 2 0 0 0 2 1.6h8.3a2 2 0 0 0 2-1.5L21 8H7" />
        </svg>
      );
      break;
    case 'product':
      icon = (
        <svg {...common}>
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
      );
      break;
    default:
      icon = (
        <svg {...common}>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      );
  }

  return (
    <span
      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles[type] ?? styles.system}`}
    >
      {icon}
    </span>
  );
}

export function DashboardView({ data }: { data: AdminDashboardData }) {
  return (
    <div className="space-y-5 animate-rise">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch">
        <div className="grid flex-1 gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  Total sales
                </p>
                <p className="mt-2 font-semibold text-2xl text-white sm:text-3xl">
                  {formatGbp(data.kpis.sales.valuePence)}
                </p>
                <div className="mt-2">
                  <ChangeBadge value={data.kpis.sales.changePct} />
                </div>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/15 text-gold">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="8" />
                  <path d="M12 8v8M9.5 10.5c0-1 1.1-1.8 2.5-1.8s2.5.8 2.5 1.8-1.1 1.8-2.5 1.8-2.5.8-2.5 1.8 1.1 1.8 2.5 1.8 2.5-.8 2.5-1.8" />
                </svg>
              </span>
            </div>
            <div className="mt-3">
              <Sparkline values={data.kpis.sales.sparkline} color="#d4af37" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  Orders
                </p>
                <p className="mt-2 font-semibold text-2xl text-white sm:text-3xl">
                  {data.kpis.orders.value.toLocaleString('en-GB')}
                </p>
                <div className="mt-2">
                  <ChangeBadge value={data.kpis.orders.changePct} />
                </div>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="9" cy="20" r="1" />
                  <circle cx="18" cy="20" r="1" />
                  <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.5L21 8H7" />
                </svg>
              </span>
            </div>
            <div className="mt-3">
              <Sparkline values={data.kpis.orders.sparkline} color="#3b82f6" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  Users
                </p>
                <p className="mt-2 font-semibold text-2xl text-white sm:text-3xl">
                  {data.kpis.users.value.toLocaleString('en-GB')}
                </p>
                <div className="mt-2">
                  <ChangeBadge value={data.kpis.users.changePct} />
                </div>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="9" cy="8" r="3.5" />
                  <path d="M2.5 19a6.5 6.5 0 0 1 13 0" />
                  <circle cx="17" cy="9" r="2.5" />
                  <path d="M16 19a5 5 0 0 1 5.5-4.7" />
                </svg>
              </span>
            </div>
            <div className="mt-3">
              <Sparkline values={data.kpis.users.sparkline} color="#a78bfa" />
            </div>
          </Card>
        </div>

        <Card className="flex flex-col justify-between p-4 xl:w-56">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
              Period
            </p>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/70">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M3 10h18M8 3v4M16 3v4" />
              </svg>
            </span>
          </div>
          <p className="mt-3 text-sm font-medium leading-snug text-white/80 sm:text-[15px]">
            {data.period.label}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-sm uppercase tracking-[0.08em] text-white">
                Sales &amp; orders
              </h2>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-white/50">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-[2px] bg-gold" /> Sales (GBP)
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-[2px] bg-blue-500" /> Orders
                </span>
              </div>
            </div>
            <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60">
              Last 30 days
            </span>
          </div>
          <SalesOrdersChart series={data.series} />
        </Card>

        <Card className="flex flex-col p-4 sm:p-5">
          <h2 className="font-semibold text-sm uppercase tracking-[0.08em] text-white">
            Recent orders
          </h2>
          <ul className="mt-4 flex-1 space-y-3">
            {data.recentOrders.length === 0 && (
              <li className="text-sm text-white/40">No orders yet.</li>
            )}
            {data.recentOrders.map((order) => {
              const meta = platformMeta(order.platform);
              return (
                <li
                  key={order.id}
                  className="flex items-center gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0"
                >
                  <img
                    src={meta.icon}
                    alt={meta.label}
                    width={28}
                    height={28}
                    className="h-7 w-7 object-contain"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-white">
                        {order.orderNumber}
                      </p>
                      <StatusPill tone={order.statusTone} label={order.statusLabel} />
                    </div>
                    <p className="truncate text-xs text-white/45">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">
                      {formatGbp(order.totalGbpPence)}
                    </p>
                    <p className="text-[11px] text-white/40">{order.timeAgo}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3 text-xs text-white/50">
            <span>Orders today: {data.today.orderCount}</span>
            <span className="font-semibold text-gold">
              Total: {formatGbp(data.today.totalPence)}
            </span>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
        <Card className="flex h-[22.5rem] flex-col overflow-hidden p-4 sm:p-5">
          <h2 className="shrink-0 font-semibold text-sm uppercase tracking-[0.08em] text-white">
            Sales by platform
          </h2>
          <div className="admin-scroll mt-4 flex min-h-0 flex-1 items-center overflow-y-auto">
            <div className="flex w-full flex-col items-center gap-5 sm:flex-row sm:items-center">
              <PlatformDonut slices={data.salesByPlatform} className="h-40 w-40 shrink-0" />
              <ul className="w-full min-w-0 space-y-3 text-sm">
                {data.salesByPlatform.map((p) => (
                  <li key={p.platform} className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                      style={{ background: p.color }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate text-white/70">{p.label}</span>
                    <span className="shrink-0 tabular-nums text-white">
                      {formatGbp(p.pence)}
                    </span>
                    <span className="w-10 shrink-0 text-right tabular-nums text-white/45">
                      {p.pct}%
                    </span>
                  </li>
                ))}
                {data.salesByPlatform.length === 0 && (
                  <li className="text-white/40">No paid sales in this period.</li>
                )}
              </ul>
            </div>
          </div>
        </Card>

        <Card className="flex h-[22.5rem] flex-col overflow-hidden p-4 sm:p-5">
          <h2 className="shrink-0 font-semibold text-sm uppercase tracking-[0.08em] text-white">
            Best sellers
          </h2>
          <ul className="admin-scroll mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {data.topProducts.length === 0 && (
              <li className="text-sm text-white/40">No product sales yet.</li>
            )}
            {data.topProducts.map((p) => {
              const meta = platformMeta(p.platform);
              return (
                <li key={`${p.name}-${p.platform}`} className="flex items-center gap-3">
                  <img
                    src={meta.icon}
                    alt={meta.label}
                    width={28}
                    height={28}
                    className="h-7 w-7 object-contain"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {productDisplayName(p.name, p.platform)}
                    </p>
                    <p className="text-xs text-white/40">{formatSold(p.quantity)}</p>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {formatGbp(p.unitPricePence)}
                  </p>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="flex h-[22.5rem] flex-col overflow-hidden p-4 sm:p-5">
          <h2 className="shrink-0 font-semibold text-sm uppercase tracking-[0.08em] text-white">
            Recent activity
          </h2>
          <ul className="admin-scroll mt-4 min-h-0 flex-1 space-y-3.5 overflow-y-auto pr-1">
            {data.activity.length === 0 && (
              <li className="text-sm text-white/40">No recent activity.</li>
            )}
            {data.activity.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <ActivityIcon type={item.type} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{item.title}</p>
                  {item.detail ? (
                    <p className="truncate text-xs text-white/45">{item.detail}</p>
                  ) : null}
                </div>
                <span className="shrink-0 pt-0.5 text-[11px] text-white/40">{item.timeAgo}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/40">Conversion rate</p>
          <p className="mt-1 font-semibold text-xl text-white">{data.bottom.conversionRate}%</p>
          <ChangeBadge value={data.bottom.conversionChange} />
        </Card>
        <Card className="px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/40">Avg. ticket</p>
          <p className="mt-1 font-semibold text-xl text-white">
            {formatGbp(data.bottom.avgTicketPence)}
          </p>
          <ChangeBadge value={data.bottom.avgTicketChange} />
        </Card>
        <Card className="px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/40">Chargebacks</p>
          <p className="mt-1 font-semibold text-xl text-white">{data.bottom.chargebacks}</p>
          <ChangeBadge value={data.bottom.chargebacksChange} />
        </Card>
        <Card className="px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/40">Pending payments</p>
          <p className="mt-1 font-semibold text-xl text-gold">{data.bottom.pendingCount}</p>
          <p className="text-xs text-white/45">{formatGbp(data.bottom.pendingPence)}</p>
        </Card>
      </div>
    </div>
  );
}

export function ComingSoon({ title }: { title: string }) {
  return (
    <Card className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center animate-rise">
      <p className="font-semibold text-2xl text-gold">{title}</p>
      <p className="mt-2 max-w-md text-sm text-white/50">
        This module is wired into the admin shell and will connect to live data in a later
        release. Use Dashboard, Orders, Users, and Products for day-to-day operations.
      </p>
    </Card>
  );
}
