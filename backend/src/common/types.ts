export type UserRole = 'customer' | 'admin';
export type PlatformType = 'ps4_ps5' | 'xbox' | 'pc';
export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  coin_amount: number;
  bonus_coins: number;
  price_gbp_pence: number;
  compare_at_gbp_pence: number | null;
  platform: PlatformType;
  is_active: boolean;
  sort_order: number;
  image_url: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string | null;
}
