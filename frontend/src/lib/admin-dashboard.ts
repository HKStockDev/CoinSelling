import { formatCoins, formatGbp, type Platform } from './site';

export type AdminTab =
  | 'dashboard'
  | 'orders'
  | 'customers'
  | 'products'
  | 'coupons'
  | 'transactions'
  | 'withdrawals'
  | 'support'
  | 'settings'
  | 'logs'
  | 'reports'
  | 'notifications'
  | 'backups';

/** URL segment → tab. Dashboard lives at `/admin`. Users at `/admin/user`. */
export const ADMIN_SECTION_TO_TAB: Record<string, AdminTab> = {
  orders: 'orders',
  user: 'customers',
  products: 'products',
  coupons: 'coupons',
  transactions: 'transactions',
  withdrawals: 'withdrawals',
  support: 'support',
  settings: 'settings',
  logs: 'logs',
  reports: 'reports',
  notifications: 'notifications',
  backups: 'backups',
};

export function adminPathForTab(tab: AdminTab): string {
  if (tab === 'dashboard') return '/admin';
  if (tab === 'customers') return '/admin/user';
  return `/admin/${tab}`;
}

export function adminTabFromPath(pathname: string): AdminTab {
  const cleaned = pathname.replace(/\/+$/, '') || '/admin';
  if (cleaned === '/admin') return 'dashboard';
  const segment = cleaned.slice('/admin/'.length).split('/')[0] ?? '';
  return ADMIN_SECTION_TO_TAB[segment] ?? 'dashboard';
}

export interface DashboardSeriesPoint {
  date: string;
  label: string;
  salesPence: number;
  orders: number;
}

export interface PlatformSales {
  platform: Platform | 'other';
  label: string;
  pence: number;
  pct: number;
  color: string;
}

export interface RecentOrderRow {
  id: string;
  orderNumber: string;
  platform: string;
  customer: string;
  status: string;
  statusLabel: string;
  statusTone: 'paid' | 'pending' | 'cancelled';
  totalGbpPence: number;
  createdAt: string;
  timeAgo: string;
}

export interface TopProductRow {
  name: string;
  platform: string;
  quantity: number;
  revenuePence: number;
  unitPricePence: number;
}

export interface ActivityItem {
  id: string;
  type: 'user' | 'order' | 'product' | 'system';
  title: string;
  detail?: string | null;
  timeAgo: string;
  createdAt: string;
}

export interface AdminDashboardData {
  productCount: number;
  orderCount: number;
  customerCount: number;
  paidRevenueGbpPence: number;
  ordersByStatus: Record<string, number>;
  period: { from: string; to: string; label: string };
  kpis: {
    sales: { valuePence: number; changePct: number; sparkline: number[] };
    orders: { value: number; changePct: number; sparkline: number[] };
    users: { value: number; changePct: number; sparkline: number[] };
  };
  series: DashboardSeriesPoint[];
  salesByPlatform: PlatformSales[];
  recentOrders: RecentOrderRow[];
  topProducts: TopProductRow[];
  activity: ActivityItem[];
  today: { orderCount: number; totalPence: number };
  bottom: {
    conversionRate: number;
    conversionChange: number;
    avgTicketPence: number;
    avgTicketChange: number;
    chargebacks: number;
    chargebacksChange: number;
    pendingCount: number;
    pendingPence: number;
  };
}

const PLATFORM_META: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  pc: { label: 'PC', color: '#f59e0b', icon: '/brand/PC.svg' },
  ps4_ps5: { label: 'PSN', color: '#3b82f6', icon: '/brand/Logo-da-psn.svg' },
  xbox: { label: 'Xbox', color: '#22c55e', icon: '/brand/xbox.svg' },
  other: { label: 'Other', color: '#6b7280', icon: '/brand/PC.svg' },
};

export function platformMeta(platform: string) {
  return PLATFORM_META[platform] ?? PLATFORM_META.other;
}

export function orderStatusMeta(status: string): {
  label: string;
  tone: 'paid' | 'pending' | 'cancelled';
} {
  if (['paid', 'processing', 'delivered'].includes(status)) {
    return { label: 'Paid', tone: 'paid' };
  }
  if (status === 'pending_payment') {
    return { label: 'Pending', tone: 'pending' };
  }
  return { label: status === 'refunded' ? 'Refunded' : 'Cancelled', tone: 'cancelled' };
}

export function timeAgo(iso: string, now = Date.now()) {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB');
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function pctChange(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function formatDayLabel(isoDay: string) {
  const d = new Date(`${isoDay}T12:00:00Z`);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  total_gbp_pence: number;
  platform: string;
  created_at: string;
  guest_email: string | null;
  profiles?: { email: string; full_name: string | null } | null;
  order_items?: Array<{
    product_name: string;
    quantity: number;
    unit_price_gbp_pence: number;
    coin_amount?: number;
  }>;
};

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
};

type PriceHistoryRow = {
  id: string;
  product_id: string;
  created_at: string;
  note: string | null;
  products?: { name: string } | null;
};

export function buildAdminDashboard(input: {
  orders: OrderRow[];
  customers: ProfileRow[];
  productsCount: number;
  priceHistory?: PriceHistoryRow[];
  days?: number;
}): AdminDashboardData {
  const days = input.days ?? 30;
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setHours(23, 59, 59, 999);
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - (days - 1));
  periodStart.setHours(0, 0, 0, 0);

  const prevEnd = new Date(periodStart);
  prevEnd.setMilliseconds(-1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (days - 1));
  prevStart.setHours(0, 0, 0, 0);

  const paidStatuses = new Set(['paid', 'processing', 'delivered']);
  const inRange = (iso: string, start: Date, end: Date) => {
    const t = new Date(iso).getTime();
    return t >= start.getTime() && t <= end.getTime();
  };

  const currentOrders = input.orders.filter((o) =>
    inRange(o.created_at, periodStart, periodEnd),
  );
  const prevOrders = input.orders.filter((o) =>
    inRange(o.created_at, prevStart, prevEnd),
  );

  const sumPaid = (rows: OrderRow[]) =>
    rows
      .filter((o) => paidStatuses.has(o.status))
      .reduce((s, o) => s + (o.total_gbp_pence ?? 0), 0);

  const salesNow = sumPaid(currentOrders);
  const salesPrev = sumPaid(prevOrders);
  const ordersNow = currentOrders.length;
  const ordersPrev = prevOrders.length;

  const customersNow = input.customers.filter((c) =>
    inRange(c.created_at, periodStart, periodEnd),
  ).length;
  const customersPrev = input.customers.filter((c) =>
    inRange(c.created_at, prevStart, prevEnd),
  ).length;

  const series: DashboardSeriesPoint[] = [];
  const salesSpark: number[] = [];
  const ordersSpark: number[] = [];
  const usersSpark: number[] = [];

  for (let i = 0; i < days; i++) {
    const d = new Date(periodStart);
    d.setDate(periodStart.getDate() + i);
    const key = dayKey(d);
    const dayOrders = currentOrders.filter((o) => dayKey(new Date(o.created_at)) === key);
    const salesPence = sumPaid(dayOrders);
    const dayUsers = input.customers.filter(
      (c) => dayKey(new Date(c.created_at)) === key,
    ).length;
    series.push({
      date: key,
      label: formatDayLabel(key),
      salesPence,
      orders: dayOrders.length,
    });
    salesSpark.push(salesPence);
    ordersSpark.push(dayOrders.length);
    usersSpark.push(dayUsers);
  }

  const platformTotals = new Map<string, number>();
  for (const o of currentOrders) {
    if (!paidStatuses.has(o.status)) continue;
    const key = o.platform in PLATFORM_META ? o.platform : 'other';
    platformTotals.set(key, (platformTotals.get(key) ?? 0) + o.total_gbp_pence);
  }
  const platformSum = [...platformTotals.values()].reduce((a, b) => a + b, 0) || 1;
  const salesByPlatform: PlatformSales[] = (['pc', 'ps4_ps5', 'xbox', 'other'] as const)
    .map((platform) => {
      const pence = platformTotals.get(platform) ?? 0;
      const meta = platformMeta(platform);
      return {
        platform,
        label: meta.label,
        pence,
        pct: Math.round((pence / platformSum) * 100),
        color: meta.color,
      };
    })
    .filter((p) => p.platform !== 'other' || p.pence > 0);

  const recentOrders: RecentOrderRow[] = [...input.orders]
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 6)
    .map((o) => {
      const status = orderStatusMeta(o.status);
      return {
        id: o.id,
        orderNumber: o.order_number,
        platform: o.platform,
        customer:
          o.profiles?.full_name ||
          o.profiles?.email ||
          o.guest_email ||
          'Guest',
        status: o.status,
        statusLabel: status.label,
        statusTone: status.tone,
        totalGbpPence: o.total_gbp_pence,
        createdAt: o.created_at,
        timeAgo: timeAgo(o.created_at),
      };
    });

  const productAgg = new Map<
    string,
    { name: string; platform: string; quantity: number; revenuePence: number; unitPricePence: number }
  >();
  for (const o of currentOrders) {
    if (!paidStatuses.has(o.status)) continue;
    for (const item of o.order_items ?? []) {
      const key = `${item.product_name}::${o.platform}`;
      const prev = productAgg.get(key) ?? {
        name: item.product_name,
        platform: o.platform,
        quantity: 0,
        revenuePence: 0,
        unitPricePence: item.unit_price_gbp_pence,
      };
      prev.quantity += item.quantity;
      prev.revenuePence += item.quantity * item.unit_price_gbp_pence;
      productAgg.set(key, prev);
    }
  }
  const topProducts = [...productAgg.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const activity: ActivityItem[] = [];
  for (const c of [...input.customers]
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 4)) {
    activity.push({
      id: `user-${c.id}`,
      type: 'user',
      title: 'New user registered',
      detail: c.full_name || c.email,
      timeAgo: timeAgo(c.created_at),
      createdAt: c.created_at,
    });
  }
  for (const o of recentOrders.slice(0, 4)) {
    activity.push({
      id: `order-${o.id}`,
      type: 'order',
      title: `Order ${o.orderNumber}`,
      detail: o.statusLabel,
      timeAgo: o.timeAgo,
      createdAt: o.createdAt,
    });
  }
  for (const ph of (input.priceHistory ?? []).slice(0, 3)) {
    activity.push({
      id: `price-${ph.id}`,
      type: 'product',
      title: 'Product updated',
      detail: ph.products?.name ?? 'Price change',
      timeAgo: timeAgo(ph.created_at),
      createdAt: ph.created_at,
    });
  }
  activity.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const todayKey = dayKey(now);
  const todayOrders = input.orders.filter(
    (o) => dayKey(new Date(o.created_at)) === todayKey,
  );
  const todayPaid = sumPaid(todayOrders);

  const paidNow = currentOrders.filter((o) => paidStatuses.has(o.status)).length;
  const paidPrev = prevOrders.filter((o) => paidStatuses.has(o.status)).length;
  const conversionNow = ordersNow ? (paidNow / ordersNow) * 100 : 0;
  const conversionPrev = ordersPrev ? (paidPrev / ordersPrev) * 100 : 0;
  const avgTicketNow = paidNow ? Math.round(salesNow / paidNow) : 0;
  const avgTicketPrev = paidPrev ? Math.round(salesPrev / paidPrev) : 0;
  const chargebacks = currentOrders.filter((o) => o.status === 'refunded').length;
  const chargebacksPrev = prevOrders.filter((o) => o.status === 'refunded').length;
  const pending = input.orders.filter((o) => o.status === 'pending_payment');

  const allPaidRevenue = input.orders
    .filter((o) => paidStatuses.has(o.status))
    .reduce((s, o) => s + o.total_gbp_pence, 0);

  const fmtRange = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return {
    productCount: input.productsCount,
    orderCount: input.orders.length,
    customerCount: input.customers.filter((c) => c.role === 'customer').length,
    paidRevenueGbpPence: allPaidRevenue,
    ordersByStatus: input.orders.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {}),
    period: {
      from: periodStart.toISOString(),
      to: periodEnd.toISOString(),
      label: `${fmtRange(periodStart)} – ${fmtRange(periodEnd)}`,
    },
    kpis: {
      sales: {
        valuePence: salesNow,
        changePct: pctChange(salesNow, salesPrev),
        sparkline: salesSpark,
      },
      orders: {
        value: ordersNow,
        changePct: pctChange(ordersNow, ordersPrev),
        sparkline: ordersSpark,
      },
      users: {
        value: customersNow || input.customers.length,
        changePct: pctChange(customersNow, customersPrev),
        sparkline: usersSpark,
      },
    },
    series,
    salesByPlatform,
    recentOrders,
    topProducts,
    activity: activity.slice(0, 6),
    today: { orderCount: todayOrders.length, totalPence: todayPaid },
    bottom: {
      conversionRate: Number(conversionNow.toFixed(2)),
      conversionChange: Number((conversionNow - conversionPrev).toFixed(1)),
      avgTicketPence: avgTicketNow,
      avgTicketChange: pctChange(avgTicketNow, avgTicketPrev),
      chargebacks,
      chargebacksChange: pctChange(chargebacks, chargebacksPrev),
      pendingCount: pending.length,
      pendingPence: pending.reduce((s, o) => s + o.total_gbp_pence, 0),
    },
  };
}

export function formatSold(qty: number) {
  if (qty >= 1000) return `${(qty / 1000).toFixed(1)}K sold`;
  return `${qty} sold`;
}

export function productDisplayName(name: string, platform: string) {
  const meta = platformMeta(platform);
  const coinsMatch = name.match(/(\d[\d,]*)\s*[kKmM]?/);
  if (coinsMatch) {
    const raw = coinsMatch[1].replace(/,/g, '');
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 1000) {
      return `${formatCoins(n)} Coins (${meta.label})`;
    }
  }
  return `${name} (${meta.label})`;
}

export { formatGbp };
