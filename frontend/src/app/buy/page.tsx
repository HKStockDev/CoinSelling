'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useCart } from '@/lib/cart';
import { formatCoins, type Product } from '@/lib/site';
import { PlatformPicker } from '@/components/PlatformPicker';
import { ProductCard } from '@/components/ProductCard';

export default function BuyPage() {
  const { platform, count } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .products(platform)
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [platform]);

  return (
    <div className="pitch-grid min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-pitch">Buy FC 26 coins</h1>
            <p className="mt-2 max-w-xl text-ink/65">
              Select your platform, then choose a coin pack. Prices are shown in GBP and
              can be updated seasonally from admin.
            </p>
          </div>
          {count > 0 && (
            <Link
              href="/cart"
              className="rounded-md bg-gold px-4 py-2 text-sm font-bold text-pitch-deep"
            >
              View cart ({count})
            </Link>
          )}
        </div>

        <div className="mt-8">
          <PlatformPicker />
        </div>

        {loading && (
          <p className="mt-10 text-sm text-ink/60">Loading packs…</p>
        )}
        {error && (
          <div className="mt-10 border border-danger/30 bg-white p-4 text-sm text-danger">
            Could not load products: {error}. Start the NestJS API and seed Supabase.
          </div>
        )}

        {!loading && !error && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <p className="mt-10 text-sm text-ink/60">
            No active packs for this platform yet.
          </p>
        )}

        <p className="mt-10 text-xs text-ink/50">
          Tip: keep at least a few thousand coins in-club before delivery. Popular packs
          start from {formatCoins(100000)}.
        </p>
      </div>
    </div>
  );
}
