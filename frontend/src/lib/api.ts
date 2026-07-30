import type { Product } from './site';
import { getSupabase, hasSupabaseConfig } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const base = API_URL.replace(/\/$/, '');
  const res = await fetch(`${base}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async products(platform?: string) {
    if (!hasSupabaseConfig()) {
      return request<Product[]>(
        `/products${platform ? `?platform=${encodeURIComponent(platform)}` : ''}`,
      );
    }
    const supabase = getSupabase();
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (platform) query = query.eq('platform', platform);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as Product[];
  },

  checkout: (
    body: {
      platform: string;
      items: { productId: string; quantity: number }[];
      guestEmail?: string;
      gameAccountEmail?: string;
      customerWhatsapp?: string;
      deliveryNotes?: string;
    },
    token?: string | null,
  ) =>
    request<{
      orderId: string;
      orderNumber: string;
      checkoutUrl: string;
      totalGbpPence: number;
    }>('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(body),
      token,
    }),

  async myOrders(_token: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async me(_token: string) {
    const supabase = getSupabase();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', auth.user.id)
      .single();
    if (error) throw new Error(error.message);
    return {
      id: data.id as string,
      email: data.email as string,
      role: data.role as string,
      fullName: (data.full_name as string | null) ?? null,
    };
  },

  async register(body: { email: string; password: string; fullName?: string }) {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: { full_name: body.fullName ?? '' },
      },
    });
    if (error) throw new Error(error.message);
    return {
      id: data.user?.id,
      email: data.user?.email,
      message: 'Account created.',
    };
  },

  async adminDashboard(_token: string) {
    const supabase = getSupabase();
    const [products, orders, customers] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id, status, total_gbp_pence'),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'customer'),
    ]);
    if (products.error) throw new Error(products.error.message);
    if (orders.error) throw new Error(orders.error.message);
    if (customers.error) throw new Error(customers.error.message);

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
  },

  async adminProducts(_token: string, platform?: string) {
    const supabase = getSupabase();
    let query = supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true });
    if (platform) query = query.eq('platform', platform);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as Product[];
  },

  async updatePrice(
    _token: string,
    id: string,
    body: {
      priceGbpPence: number;
      compareAtGbpPence?: number | null;
      note?: string;
    },
  ) {
    const supabase = getSupabase();
    const { data: current, error: currentError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    if (currentError) throw new Error(currentError.message);

    const { data, error } = await supabase
      .from('products')
      .update({
        price_gbp_pence: body.priceGbpPence,
        compare_at_gbp_pence:
          body.compareAtGbpPence === undefined
            ? current.compare_at_gbp_pence
            : body.compareAtGbpPence,
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);

    const { data: auth } = await supabase.auth.getUser();
    await supabase.from('price_history').insert({
      product_id: id,
      old_price_gbp_pence: current.price_gbp_pence,
      new_price_gbp_pence: body.priceGbpPence,
      changed_by: auth.user?.id ?? null,
      note: body.note ?? 'Seasonal price update',
    });

    return data;
  },

  async adminOrders(_token: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), profiles(email, full_name)')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{
      id: string;
      order_number: string;
      status: string;
      total_gbp_pence: number;
      platform: string;
      created_at: string;
      guest_email: string | null;
      profiles?: { email: string; full_name: string | null } | null;
      order_items: Array<{ product_name: string; quantity: number }>;
    }>;
  },

  async updateOrderStatus(
    _token: string,
    id: string,
    body: { status: string; adminNotes?: string },
  ) {
    const supabase = getSupabase();
    const patch: Record<string, unknown> = { status: body.status };
    if (body.adminNotes !== undefined) patch.admin_notes = body.adminNotes;
    if (body.status === 'delivered') {
      patch.delivered_at = new Date().toISOString();
    }
    const { data, error } = await supabase
      .from('orders')
      .update(patch)
      .eq('id', id)
      .select('*, order_items(*)')
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async adminCustomers(_token: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{
      id: string;
      email: string;
      full_name: string | null;
      role: string;
      created_at: string;
    }>;
  },
};
