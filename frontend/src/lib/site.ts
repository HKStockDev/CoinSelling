export const SITE = {
  name: 'FutCoins Empire',
  shortName: 'Empire',
  tagline: 'Compre FIFA Coins com entrega imediata, 100% anti-ban e o melhor preço.',
  whatsappE164: '447307318243',
  whatsappDisplay: '07307 318243',
  currency: 'GBP',
  supportHours: '24/7 delivery support',
} as const;

export function whatsappUrl(message?: string) {
  const text = encodeURIComponent(
    message ??
      `Hi ${SITE.name}, I need help with buying FC 26 coins.`,
  );
  return `https://wa.me/${SITE.whatsappE164}?text=${text}`;
}

export type Platform = 'ps4_ps5' | 'xbox' | 'pc';

export const PLATFORMS: { id: Platform; label: string }[] = [
  { id: 'ps4_ps5', label: 'PlayStation' },
  { id: 'xbox', label: 'Xbox' },
  { id: 'pc', label: 'PC' },
];

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  coin_amount: number;
  bonus_coins: number;
  price_gbp_pence: number;
  compare_at_gbp_pence: number | null;
  platform: Platform;
  is_active: boolean;
  sort_order: number;
  image_url: string | null;
}

export function formatGbp(pence: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pence / 100);
}

export function formatCoins(amount: number) {
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return `${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}K`;
  return String(amount);
}
