import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthUser, OrderStatus, PlatformType } from '../common/types';

@Injectable()
export class AdminService {
  constructor(private readonly supabase: SupabaseService) {}

  async dashboard() {
    const [products, orders, customers, priceHistory] = await Promise.all([
      this.supabase.db.from('products').select('id', { count: 'exact', head: true }),
      this.supabase.db
        .from('orders')
        .select(
          'id, order_number, status, total_gbp_pence, platform, created_at, guest_email, profiles(email, full_name), order_items(product_name, quantity, unit_price_gbp_pence, coin_amount)',
        )
        .order('created_at', { ascending: false }),
      this.supabase.db
        .from('profiles')
        .select('id, email, full_name, role, created_at')
        .order('created_at', { ascending: false }),
      this.supabase.db
        .from('price_history')
        .select('id, product_id, created_at, note, products(name)')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    if (orders.error) throw orders.error;
    if (customers.error) throw customers.error;

    const asOne = <T,>(value: T | T[] | null | undefined): T | null => {
      if (Array.isArray(value)) return (value[0] as T) ?? null;
      return (value as T) ?? null;
    };

    // Keep response shape aligned with the frontend admin dashboard builder.
    const paidStatuses = new Set(['paid', 'processing', 'delivered']);
    const orderRows = (orders.data ?? []).map((row) => ({
      ...row,
      profiles: asOne(
        row.profiles as
          | { email: string; full_name: string | null }
          | { email: string; full_name: string | null }[]
          | null,
      ),
    }));
    const customerRows = customers.data ?? [];
    const historyRows = (priceHistory.data ?? []).map((row) => ({
      ...row,
      products: asOne(row.products as { name: string } | { name: string }[] | null),
    }));
    const paidRevenue = orderRows
      .filter((o) => paidStatuses.has(o.status))
      .reduce((sum, o) => sum + (o.total_gbp_pence ?? 0), 0);

    const now = new Date();
    const days = 30;
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

    const inRange = (iso: string, start: Date, end: Date) => {
      const t = new Date(iso).getTime();
      return t >= start.getTime() && t <= end.getTime();
    };
    const currentOrders = orderRows.filter((o) =>
      inRange(o.created_at, periodStart, periodEnd),
    );
    const prevOrders = orderRows.filter((o) => inRange(o.created_at, prevStart, prevEnd));
    const sumPaid = (rows: typeof orderRows) =>
      rows
        .filter((o) => paidStatuses.has(o.status))
        .reduce((s, o) => s + (o.total_gbp_pence ?? 0), 0);
    const pctChange = (current: number, previous: number) => {
      if (previous <= 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    const salesNow = sumPaid(currentOrders);
    const salesPrev = sumPaid(prevOrders);
    const series = Array.from({ length: days }, (_, i) => {
      const d = new Date(periodStart);
      d.setDate(periodStart.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const dayOrders = currentOrders.filter(
        (o) => new Date(o.created_at).toISOString().slice(0, 10) === key,
      );
      return {
        date: key,
        label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        salesPence: sumPaid(dayOrders),
        orders: dayOrders.length,
      };
    });

    const platformTotals = new Map<string, number>();
    for (const o of currentOrders) {
      if (!paidStatuses.has(o.status)) continue;
      platformTotals.set(
        o.platform,
        (platformTotals.get(o.platform) ?? 0) + o.total_gbp_pence,
      );
    }
    const platformSum = [...platformTotals.values()].reduce((a, b) => a + b, 0) || 1;
    const platformColors: Record<string, string> = {
      pc: '#f59e0b',
      ps4_ps5: '#3b82f6',
      xbox: '#22c55e',
    };
    const platformLabels: Record<string, string> = {
      pc: 'PC',
      ps4_ps5: 'PSN',
      xbox: 'Xbox',
    };
    const salesByPlatform = ['pc', 'ps4_ps5', 'xbox']
      .map((platform) => {
        const pence = platformTotals.get(platform) ?? 0;
        return {
          platform,
          label: platformLabels[platform],
          pence,
          pct: Math.round((pence / platformSum) * 100),
          color: platformColors[platform],
        };
      })
      .filter((p) => p.pence > 0 || platformTotals.size === 0);

    const recentOrders = orderRows.slice(0, 6).map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      platform: o.platform,
      customer:
        o.profiles?.full_name ||
        o.profiles?.email ||
        o.guest_email ||
        'Guest',
      status: o.status,
      totalGbpPence: o.total_gbp_pence,
      createdAt: o.created_at,
    }));

    const todayKey = now.toISOString().slice(0, 10);
    const todayOrders = orderRows.filter(
      (o) => new Date(o.created_at).toISOString().slice(0, 10) === todayKey,
    );
    const pending = orderRows.filter((o) => o.status === 'pending_payment');
    const paidNow = currentOrders.filter((o) => paidStatuses.has(o.status)).length;
    const paidPrev = prevOrders.filter((o) => paidStatuses.has(o.status)).length;
    const conversionNow = currentOrders.length
      ? (paidNow / currentOrders.length) * 100
      : 0;
    const conversionPrev = prevOrders.length
      ? (paidPrev / prevOrders.length) * 100
      : 0;
    const avgTicketNow = paidNow ? Math.round(salesNow / paidNow) : 0;
    const avgTicketPrev = paidPrev ? Math.round(salesPrev / paidPrev) : 0;
    const chargebacks = currentOrders.filter((o) => o.status === 'refunded').length;
    const chargebacksPrev = prevOrders.filter((o) => o.status === 'refunded').length;

    const customersNow = customerRows.filter((c) =>
      inRange(c.created_at, periodStart, periodEnd),
    ).length;
    const customersPrev = customerRows.filter((c) =>
      inRange(c.created_at, prevStart, prevEnd),
    ).length;

    const fmtRange = (d: Date) =>
      d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

    return {
      productCount: products.count ?? 0,
      orderCount: orderRows.length,
      customerCount: customerRows.filter((c) => c.role === 'customer').length,
      paidRevenueGbpPence: paidRevenue,
      ordersByStatus: orderRows.reduce<Record<string, number>>((acc, o) => {
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
          sparkline: series.map((s) => s.salesPence),
        },
        orders: {
          value: currentOrders.length,
          changePct: pctChange(currentOrders.length, prevOrders.length),
          sparkline: series.map((s) => s.orders),
        },
        users: {
          value: customersNow || customerRows.length,
          changePct: pctChange(customersNow, customersPrev),
          sparkline: series.map((s) => {
            const key = s.date;
            return customerRows.filter(
              (c) => new Date(c.created_at).toISOString().slice(0, 10) === key,
            ).length;
          }),
        },
      },
      series,
      salesByPlatform,
      recentOrders,
      topProducts: [],
      activity: [
        ...customerRows.slice(0, 3).map((c) => ({
          id: `user-${c.id}`,
          type: 'user' as const,
          title: `New user registered · ${c.full_name || c.email}`,
          createdAt: c.created_at,
        })),
        ...recentOrders.slice(0, 3).map((o) => ({
          id: `order-${o.id}`,
          type: 'order' as const,
          title: `Order ${o.orderNumber} · ${o.status}`,
          createdAt: o.createdAt,
        })),
        ...(historyRows ?? []).slice(0, 2).map((ph) => ({
          id: `price-${ph.id}`,
          type: 'product' as const,
          title: `Product updated · ${ph.products?.name ?? 'Price change'}`,
          createdAt: ph.created_at,
        })),
      ],
      today: {
        orderCount: todayOrders.length,
        totalPence: sumPaid(todayOrders),
      },
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

  async listProducts(platform?: PlatformType) {
    let query = this.supabase.db
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true });
    if (platform) query = query.eq('platform', platform);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async updateProductPrice(
    admin: AuthUser,
    productId: string,
    priceGbpPence: number,
    compareAtGbpPence?: number | null,
    note?: string,
  ) {
    const { data: current, error } = await this.supabase.db
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();
    if (error) throw error;
    if (!current) throw new NotFoundException('Product not found');

    const { data: updated, error: updateError } = await this.supabase.db
      .from('products')
      .update({
        price_gbp_pence: priceGbpPence,
        compare_at_gbp_pence:
          compareAtGbpPence === undefined
            ? current.compare_at_gbp_pence
            : compareAtGbpPence,
      })
      .eq('id', productId)
      .select('*')
      .single();
    if (updateError) throw new BadRequestException(updateError.message);

    await this.supabase.db.from('price_history').insert({
      product_id: productId,
      old_price_gbp_pence: current.price_gbp_pence,
      new_price_gbp_pence: priceGbpPence,
      changed_by: admin.id,
      note: note ?? 'Seasonal price update',
    });

    return updated;
  }

  async upsertProduct(payload: {
    id?: string;
    slug: string;
    name: string;
    description?: string;
    coinAmount: number;
    bonusCoins?: number;
    priceGbpPence: number;
    compareAtGbpPence?: number | null;
    platform: PlatformType;
    isActive?: boolean;
    sortOrder?: number;
  }) {
    const row = {
      slug: payload.slug,
      name: payload.name,
      description: payload.description ?? '',
      coin_amount: payload.coinAmount,
      bonus_coins: payload.bonusCoins ?? 0,
      price_gbp_pence: payload.priceGbpPence,
      compare_at_gbp_pence: payload.compareAtGbpPence ?? null,
      platform: payload.platform,
      is_active: payload.isActive ?? true,
      sort_order: payload.sortOrder ?? 0,
    };

    const query = payload.id
      ? this.supabase.db.from('products').update(row).eq('id', payload.id)
      : this.supabase.db.from('products').insert(row);

    const { data, error } = await query.select('*').single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async deleteProduct(productId: string) {
    const { data: current, error: findError } = await this.supabase.db
      .from('products')
      .select('id')
      .eq('id', productId)
      .maybeSingle();
    if (findError) throw findError;
    if (!current) throw new NotFoundException('Product not found');

    const { error } = await this.supabase.db
      .from('products')
      .delete()
      .eq('id', productId);
    if (error) throw new BadRequestException(error.message);
    return { ok: true };
  }

  async listOrders(status?: OrderStatus) {
    let query = this.supabase.db
      .from('orders')
      .select('*, order_items(*), profiles(email, full_name)')
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    adminNotes?: string,
  ) {
    const patch: Record<string, unknown> = { status };
    if (adminNotes !== undefined) patch.admin_notes = adminNotes;
    if (status === 'delivered') patch.delivered_at = new Date().toISOString();

    const { data, error } = await this.supabase.db
      .from('orders')
      .update(patch)
      .eq('id', orderId)
      .select('*, order_items(*)')
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async listCustomers() {
    const { data, error } = await this.supabase.db
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async setCustomerRole(userId: string, role: 'customer' | 'admin') {
    const { data, error } = await this.supabase.db
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select('id, email, full_name, role')
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
