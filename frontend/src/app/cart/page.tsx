'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { formatCoins, formatGbp, PLATFORMS } from '@/lib/site';

export default function CartPage() {
  const { items, platform, removeItem, totalPence, clear, setDrawerOpen } =
    useCart();
  const platformLabel =
    PLATFORMS.find((p) => p.id === platform)?.label ?? platform;

  return (
    <div className="min-h-screen bg-black pt-[72px] text-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-4xl uppercase">Your cart</h1>
        <p className="mt-2 text-sm text-white/55">Platform: {platformLabel}</p>

        {items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-white/70">Your cart is empty.</p>
            <Link
              href="/#buy"
              className="gold-btn mt-4 inline-block rounded-xl px-4 py-2 text-sm"
            >
              Choose coins
            </Link>
          </div>
        ) : (
          <>
            <ul className="mt-8 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.03]">
              {items.map((item) => (
                <li
                  key={item.product.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"
                >
                  <div>
                    <p className="font-display uppercase text-white">
                      {formatCoins(item.product.coin_amount)} · {item.product.name}
                    </p>
                    <p className="text-sm text-white/50">
                      Qty {item.quantity} · {formatGbp(item.product.price_gbp_pence)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-display text-gold">
                      {formatGbp(item.product.price_gbp_pence * item.quantity)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.product.id)}
                      className="text-sm text-red-400 hover:underline"
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
                className="text-sm text-white/50 hover:text-gold"
              >
                Clear cart
              </button>
              <div className="text-right">
                <p className="text-sm text-white/50">Total (GBP)</p>
                <p className="font-display text-3xl gold-txt">
                  {formatGbp(totalPence)}
                </p>
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="rounded-xl border border-white/15 px-4 py-2 text-sm"
                  >
                    Open drawer
                  </button>
                  <Link
                    href="/checkout"
                    className="gold-btn inline-block rounded-xl px-5 py-2.5 text-sm"
                  >
                    Go to checkout
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
