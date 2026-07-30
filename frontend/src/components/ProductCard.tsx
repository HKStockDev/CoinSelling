'use client';

import { formatCoins, formatGbp, type Product } from '@/lib/site';
import { useCart } from '@/lib/cart';

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const hasCompare =
    product.compare_at_gbp_pence != null &&
    product.compare_at_gbp_pence > product.price_gbp_pence;

  return (
    <article className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-gold/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-3xl gold-txt">
            {formatCoins(product.coin_amount)}
          </p>
          {product.bonus_coins > 0 && (
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-green">
              +{formatCoins(product.bonus_coins)} bonus
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="font-display text-lg text-gold">
            {formatGbp(product.price_gbp_pence)}
          </p>
          {hasCompare && (
            <p className="text-sm text-muted line-through">
              {formatGbp(product.compare_at_gbp_pence!)}
            </p>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm text-white/55">{product.name}</p>
      <button
        type="button"
        onClick={() => addItem(product)}
        className="gold-btn mt-4 rounded-xl px-3 py-2.5 text-sm"
      >
        Comprar Agora
      </button>
    </article>
  );
}
