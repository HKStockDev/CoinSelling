'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAdminShell } from '@/components/admin/AdminShell';
import { formatCoins, PLATFORMS, type Platform, type Product } from '@/lib/site';

export function ProductsView() {
  const { user } = useAuth();
  const { setMessage, setError } = useAdminShell();
  const [platform, setPlatform] = useState<Platform>('ps4_ps5');
  const [products, setProducts] = useState<Product[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setFetching(true);
    void api
      .adminProducts(user.accessToken, platform)
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, platform, setError]);

  async function savePrice(e: FormEvent<HTMLFormElement>, product: Product) {
    e.preventDefault();
    if (!user) return;
    setMessage(null);
    setError(null);
    const form = new FormData(e.currentTarget);
    const pounds = Number(form.get('price'));
    const compare = form.get('compare');
    const note = String(form.get('note') || 'Seasonal update');
    if (!Number.isFinite(pounds) || pounds <= 0) {
      setError('Enter a valid GBP price');
      return;
    }
    try {
      await api.updatePrice(user.accessToken, product.id, {
        priceGbpPence: Math.round(pounds * 100),
        compareAtGbpPence:
          compare === '' || compare == null ? null : Math.round(Number(compare) * 100),
        note,
      });
      setMessage(`Updated ${product.name}`);
      const refreshed = await api.adminProducts(user.accessToken, platform);
      setProducts(refreshed);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="animate-rise space-y-5">
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlatform(p.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              platform === p.id
                ? 'bg-gold font-semibold text-black'
                : 'border border-white/10 text-white/70 hover:border-gold/40'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {fetching && products.length === 0 ? (
        <p className="text-sm text-white/45">Loading products…</p>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <form
              key={product.id}
              onSubmit={(e) => void savePrice(e, product)}
              className="grid gap-3 rounded-xl border border-white/8 bg-[#12141a] p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:items-end"
            >
              <div>
                <p className="font-semibold text-white">
                  {formatCoins(product.coin_amount)} · {product.name}
                </p>
                <p className="text-xs text-white/40">{product.slug}</p>
              </div>
              <label className="text-xs text-white/50">
                Price (GBP)
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  defaultValue={(product.price_gbp_pence / 100).toFixed(2)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b0c10] px-2 py-2 text-sm text-white"
                />
              </label>
              <label className="text-xs text-white/50">
                Compare at (GBP)
                <input
                  name="compare"
                  type="number"
                  step="0.01"
                  min="0.01"
                  defaultValue={
                    product.compare_at_gbp_pence
                      ? (product.compare_at_gbp_pence / 100).toFixed(2)
                      : ''
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b0c10] px-2 py-2 text-sm text-white"
                />
              </label>
              <label className="text-xs text-white/50">
                Note
                <input
                  name="note"
                  defaultValue="Seasonal update"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b0c10] px-2 py-2 text-sm text-white"
                />
              </label>
              <button
                type="submit"
                className="rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-black"
              >
                Save
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
