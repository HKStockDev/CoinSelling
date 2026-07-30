'use client';

import { formatCoins, formatGbp, type Product } from '@/lib/site';
import { useCart } from '@/lib/cart';

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const hasCompare =
    product.compare_at_gbp_pence != null &&
    product.compare_at_gbp_pence > product.price_gbp_pence;

  return (
    <article className="group flex flex-col border border-pitch/10 bg-white/70 p-4 transition hover:border-gold/60 hover:bg-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-3xl text-pitch">
            {formatCoins(product.coin_amount)}
          </p>
          {product.bonus_coins > 0 && (
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gold">
              +{formatCoins(product.bonus_coins)} bonus
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-pitch">
            {formatGbp(product.price_gbp_pence)}
          </p>
          {hasCompare && (
            <p className="text-sm text-ink/45 line-through">
              {formatGbp(product.compare_at_gbp_pence!)}
            </p>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm text-ink/65">{product.name}</p>
      <button
        type="button"
        onClick={() => addItem(product)}
        className="mt-4 rounded-md bg-pitch px-3 py-2 text-sm font-semibold text-cream transition group-hover:bg-pitch-deep"
      >
        Add to cart
      </button>
    </article>
  );
}
