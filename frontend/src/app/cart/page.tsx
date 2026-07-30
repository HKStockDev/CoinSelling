'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { formatCoins, formatGbp, PLATFORMS } from '@/lib/site';

export default function CartPage() {
  const { items, platform, removeItem, totalPence, clear } = useCart();
  const platformLabel =
    PLATFORMS.find((p) => p.id === platform)?.label ?? platform;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl text-pitch">Your cart</h1>
      <p className="mt-2 text-sm text-ink/65">Platform: {platformLabel}</p>

      {items.length === 0 ? (
        <div className="mt-10 border border-pitch/10 bg-white/70 p-6">
          <p className="text-ink/70">Your cart is empty.</p>
          <Link
            href="/buy"
            className="mt-4 inline-block rounded-md bg-pitch px-4 py-2 text-sm font-semibold text-cream"
          >
            Browse coin packs
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-8 divide-y divide-pitch/10 border border-pitch/10 bg-white/80">
            {items.map((item) => (
              <li
                key={item.product.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"
              >
                <div>
                  <p className="font-semibold text-pitch">
                    {formatCoins(item.product.coin_amount)} · {item.product.name}
                  </p>
                  <p className="text-sm text-ink/60">
                    Qty {item.quantity} · {formatGbp(item.product.price_gbp_pence)} each
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold text-pitch">
                    {formatGbp(item.product.price_gbp_pence * item.quantity)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeItem(item.product.id)}
                    className="text-sm text-danger hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={clear}
              className="text-sm text-ink/60 hover:text-pitch"
            >
              Clear cart
            </button>
            <div className="text-right">
              <p className="text-sm text-ink/60">Total (GBP)</p>
              <p className="font-display text-3xl text-pitch">
                {formatGbp(totalPence)}
              </p>
              <Link
                href="/checkout"
                className="mt-3 inline-block rounded-md bg-gold px-5 py-2.5 text-sm font-bold text-pitch-deep"
              >
                Checkout with Stripe
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
