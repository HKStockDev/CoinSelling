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
    const [products, orders, customers] = await Promise.all([
      this.supabase.db.from('products').select('id', { count: 'exact', head: true }),
      this.supabase.db.from('orders').select('id, status, total_gbp_pence'),
      this.supabase.db
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'customer'),
    ]);

    const orderRows = orders.data ?? [];
    const paidRevenue = orderRows
      .filter((o) => ['paid', 'processing', 'delivered'].includes(o.status))
      .reduce((sum, o) => sum + (o.total_gbp_pence ?? 0), 0);

    return {
      productCount: products.count ?? 0,
      orderCount: orderRows.length,
      customerCount: customers.count ?? 0,
      paidRevenueGbpPence: paidRevenue,
      ordersByStatus: orderRows.reduce<Record<string, number>>((acc, o) => {
        acc[o.status] = (acc[o.status] ?? 0) + 1;
        return acc;
      }, {}),
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
