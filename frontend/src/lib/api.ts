import type { Platform, Product } from './site';
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
      .select('id, email, full_name, role, avatar_url')
      .eq('id', auth.user.id)
      .single();
    if (error) throw new Error(error.message);
    return {
      id: data.id as string,
      email: data.email as string,
      role: data.role as string,
      fullName: (data.full_name as string | null) ?? null,
      avatarUrl: (data.avatar_url as string | null) ?? null,
    };
  },

  async updateProfile(_token: string, body: { fullName: string }) {
    const supabase = getSupabase();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error('Not authenticated');
    const name = body.fullName.trim();
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name })
      .eq('id', auth.user.id);
    if (error) throw new Error(error.message);
    await supabase.auth.updateUser({ data: { full_name: name } });
    return { fullName: name };
  },

  async uploadAvatar(_token: string, file: File) {
    const supabase = getSupabase();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error('Not authenticated');

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      throw new Error('Use a JPG, PNG, WEBP, or GIF image.');
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('Image must be 2MB or smaller.');
    }

    // Knock out light/white backgrounds and store as transparent PNG
    const prepared = await prepareAvatarPng(file);
    const path = `${auth.user.id}/avatar.png`;

    // Clear any older avatar.* variants
    const { data: existing } = await supabase.storage
      .from('avatars')
      .list(auth.user.id);
    if (existing?.length) {
      await supabase.storage
        .from('avatars')
        .remove(existing.map((f) => `${auth.user!.id}/${f.name}`));
    }

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, prepared, {
        upsert: true,
        contentType: 'image/png',
        cacheControl: '3600',
      });
    if (uploadError) throw new Error(uploadError.message);

    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = `${pub.publicUrl}?v=${Date.now()}`;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', auth.user.id);
    if (profileError) throw new Error(profileError.message);

    await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
    return { avatarUrl };
  },

  async removeAvatar(_token: string) {
    const supabase = getSupabase();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error('Not authenticated');

    const { data: files } = await supabase.storage
      .from('avatars')
      .list(auth.user.id);
    if (files?.length) {
      await supabase.storage
        .from('avatars')
        .remove(files.map((f) => `${auth.user!.id}/${f.name}`));
    }

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', auth.user.id);
    if (error) throw new Error(error.message);
    await supabase.auth.updateUser({ data: { avatar_url: null } });
    return { avatarUrl: null };
  },

  async updatePassword(_token: string, password: string) {
    const supabase = getSupabase();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
    return { message: 'Password updated.' };
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
    if (!data.user) throw new Error('Account creation failed');
    return {
      id: data.user.id,
      email: data.user.email,
      message: 'Account created.',
    };
  },

  async setCustomerRole(
    _token: string,
    userId: string,
    role: 'customer' | 'admin',
  ) {
    return request<{
      id: string;
      email: string;
      full_name: string | null;
      role: string;
      created_at: string;
    }>(`/admin/customers/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  async createCustomer(
    _token: string,
    body: {
      email: string;
      password: string;
      fullName?: string;
      role?: 'customer' | 'admin';
    },
  ) {
    return request<{
      id: string;
      email: string;
      full_name: string | null;
      role: string;
      avatar_url: string | null;
      created_at: string;
    }>('/admin/customers', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async updateCustomer(
    _token: string,
    userId: string,
    body: {
      email?: string;
      password?: string;
      fullName?: string | null;
      role?: 'customer' | 'admin';
    },
  ) {
    return request<{
      id: string;
      email: string;
      full_name: string | null;
      role: string;
      avatar_url: string | null;
      created_at: string;
    }>(`/admin/customers/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  async deleteCustomer(_token: string, userId: string) {
    return request<{ ok: boolean }>(`/admin/customers/${userId}`, {
      method: 'DELETE',
    });
  },

  async adminDashboard(_token: string) {
    const { buildAdminDashboard } = await import('./admin-dashboard');
    const supabase = getSupabase();
    const [products, orders, customers, priceHistory] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase
        .from('orders')
        .select(
          'id, order_number, status, total_gbp_pence, platform, created_at, guest_email, profiles(email, full_name), order_items(product_name, quantity, unit_price_gbp_pence, coin_amount)',
        )
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, email, full_name, role, created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('price_history')
        .select('id, product_id, created_at, note, products(name)')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);
    if (products.error) throw new Error(products.error.message);
    if (orders.error) throw new Error(orders.error.message);
    if (customers.error) throw new Error(customers.error.message);

    const asOne = <T,>(value: T | T[] | null | undefined): T | null => {
      if (Array.isArray(value)) return value[0] ?? null;
      return value ?? null;
    };

    const orderRows = (orders.data ?? []).map((row) => ({
      ...row,
      profiles: asOne(row.profiles as { email: string; full_name: string | null } | { email: string; full_name: string | null }[]),
    }));

    const historyRows = (priceHistory.data ?? []).map((row) => ({
      ...row,
      products: asOne(row.products as { name: string } | { name: string }[]),
    }));

    return buildAdminDashboard({
      orders: orderRows,
      customers: customers.data ?? [],
      productsCount: products.count ?? 0,
      priceHistory: historyRows,
    });
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

  async createProduct(
    _token: string,
    body: {
      slug: string;
      name: string;
      description?: string;
      coinAmount: number;
      bonusCoins?: number;
      priceGbpPence: number;
      compareAtGbpPence?: number | null;
      platform: Platform;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('products')
      .insert({
        slug: body.slug,
        name: body.name,
        description: body.description ?? '',
        coin_amount: body.coinAmount,
        bonus_coins: body.bonusCoins ?? 0,
        price_gbp_pence: body.priceGbpPence,
        compare_at_gbp_pence: body.compareAtGbpPence ?? null,
        platform: body.platform,
        is_active: body.isActive ?? true,
        sort_order: body.sortOrder ?? 0,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as Product;
  },

  async deleteProduct(_token: string, id: string) {
    const supabase = getSupabase();
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(error.message);
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
      user_id: string | null;
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
      .select('id, email, full_name, role, avatar_url, created_at')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{
      id: string;
      email: string;
      full_name: string | null;
      role: string;
      avatar_url: string | null;
      created_at: string;
    }>;
  },
};

/** Fit image and make near-white backgrounds transparent (PNG). */
async function prepareAvatarPng(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process image.');

  ctx.clearRect(0, 0, size, size);
  const scale = Math.min(size / bitmap.width, size / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);
  bitmap.close();

  const imageData = ctx.getImageData(0, 0, size, size);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const avg = (r + g + b) / 3;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    // Flat light/white (and pale gray) backgrounds → transparent
    if (avg >= 235 && chroma < 28) {
      d[i + 3] = 0;
    } else if (avg >= 210 && chroma < 22) {
      d[i + 3] = Math.round(d[i + 3] * ((235 - avg) / 25));
    }
  }
  ctx.putImageData(imageData, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Could not export avatar.'))),
      'image/png',
    );
  });
  return new File([blob], 'avatar.png', { type: 'image/png' });
}
