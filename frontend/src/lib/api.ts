import type { Product } from './site';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_URL}${path}`, {
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
  products: (platform?: string) =>
    request<Product[]>(
      `/products${platform ? `?platform=${encodeURIComponent(platform)}` : ''}`,
    ),
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
  myOrders: (token: string) =>
    request<unknown[]>('/orders/mine', { token }),
  me: (token: string) =>
    request<{ id: string; email: string; role: string; fullName: string | null }>(
      '/auth/me',
      { token },
    ),
  register: (body: { email: string; password: string; fullName?: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  adminDashboard: (token: string) =>
    request<Record<string, unknown>>('/admin/dashboard', { token }),
  adminProducts: (token: string, platform?: string) =>
    request<Product[]>(
      `/admin/products${platform ? `?platform=${encodeURIComponent(platform)}` : ''}`,
      { token },
    ),
  updatePrice: (
    token: string,
    id: string,
    body: { priceGbpPence: number; compareAtGbpPence?: number | null; note?: string },
  ) =>
    request(`/admin/products/${id}/price`, {
      method: 'PATCH',
      body: JSON.stringify(body),
      token,
    }),
  adminOrders: (token: string) =>
    request<
      Array<{
        id: string;
        order_number: string;
        status: string;
        total_gbp_pence: number;
        platform: string;
        created_at: string;
        guest_email: string | null;
        profiles?: { email: string; full_name: string | null } | null;
        order_items: Array<{ product_name: string; quantity: number }>;
      }>
    >('/admin/orders', { token }),
  updateOrderStatus: (
    token: string,
    id: string,
    body: { status: string; adminNotes?: string },
  ) =>
    request(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(body),
      token,
    }),
  adminCustomers: (token: string) =>
    request<
      Array<{
        id: string;
        email: string;
        full_name: string | null;
        role: string;
        created_at: string;
      }>
    >('/admin/customers', { token }),
};
