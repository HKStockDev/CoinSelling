'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAdminShell } from '@/components/admin/AdminShell';
import { formatCoins, PLATFORMS, type Platform, type Product } from '@/lib/site';

const fieldClass =
  'mt-1 w-full rounded-lg border border-white/10 bg-[#0b0c10] px-2 py-2 text-sm text-white outline-none focus:border-gold/40';

function productMatchesSearch(product: Product, q: string) {
  if (!q) return true;
  const price = (product.price_gbp_pence / 100).toFixed(2);
  const compare = product.compare_at_gbp_pence
    ? (product.compare_at_gbp_pence / 100).toFixed(2)
    : '';
  const hay = [
    product.name,
    product.slug,
    product.description,
    String(product.coin_amount),
    price,
    compare,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

function platformSuffix(platform: Platform) {
  if (platform === 'ps4_ps5') return 'ps';
  return platform;
}

function slugFromCoins(coins: number, platform: Platform) {
  let amount: string;
  if (coins >= 1_000_000) {
    const m = coins / 1_000_000;
    amount = Number.isInteger(m) ? `${m}m` : `${String(m).replace('.', '-')}m`;
  } else if (coins >= 1000) {
    amount = `${Math.round(coins / 1000)}k`;
  } else {
    amount = String(coins);
  }
  return `fc26-${amount}-${platformSuffix(platform)}`;
}

function parseCoinInput(raw: string) {
  const cleaned = raw.trim().toLowerCase().replace(/,/g, '');
  if (!cleaned) return NaN;
  if (cleaned.endsWith('m')) {
    const n = Number(cleaned.slice(0, -1));
    return Number.isFinite(n) ? Math.round(n * 1_000_000) : NaN;
  }
  if (cleaned.endsWith('k')) {
    const n = Number(cleaned.slice(0, -1));
    return Number.isFinite(n) ? Math.round(n * 1000) : NaN;
  }
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n) : NaN;
}

function platformLabel(platform: Platform) {
  return PLATFORMS.find((p) => p.id === platform)?.label ?? platform;
}

export function ProductsView() {
  const { user } = useAuth();
  const { search, setMessage, setError } = useAdminShell();
  const [platform, setPlatform] = useState<Platform>('ps4_ps5');
  const [products, setProducts] = useState<Product[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newCoins, setNewCoins] = useState('100K');
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCompare, setNewCompare] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);

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

  const coinAmount = useMemo(() => parseCoinInput(newCoins), [newCoins]);

  useEffect(() => {
    if (!Number.isFinite(coinAmount) || coinAmount <= 0) return;
    const label = formatCoins(coinAmount);
    if (!nameTouched) setNewName(`${label} Safe Coins`);
    if (!slugTouched) setNewSlug(slugFromCoins(coinAmount, platform));
  }, [coinAmount, platform, nameTouched, slugTouched]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => productMatchesSearch(p, q));
  }, [products, search]);

  async function refresh() {
    if (!user) return;
    const refreshed = await api.adminProducts(user.accessToken, platform);
    setProducts(refreshed);
  }

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
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function createProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    setMessage(null);
    setError(null);

    if (!Number.isFinite(coinAmount) || coinAmount < 1000) {
      setError('Enter a valid coin amount (e.g. 100K or 1.5M)');
      return;
    }
    const name = newName.trim();
    const slug = newSlug.trim().toLowerCase();
    const pounds = Number(newPrice);
    if (!name || !slug) {
      setError('Name and slug are required');
      return;
    }
    if (!Number.isFinite(pounds) || pounds <= 0) {
      setError('Enter a valid GBP price');
      return;
    }

    const compareRaw = newCompare.trim();
    const comparePence =
      compareRaw === '' ? null : Math.round(Number(compareRaw) * 100);
    if (compareRaw !== '' && (!Number.isFinite(Number(compareRaw)) || Number(compareRaw) <= 0)) {
      setError('Enter a valid compare-at price or leave it blank');
      return;
    }

    setCreating(true);
    try {
      const maxSort = products.reduce((m, p) => Math.max(m, p.sort_order ?? 0), 0);
      await api.createProduct(user.accessToken, {
        slug,
        name,
        description: `EA FC 26 Ultimate Team coins for ${platformLabel(platform)}.`,
        coinAmount,
        bonusCoins: Math.round(coinAmount * 0.08),
        priceGbpPence: Math.round(pounds * 100),
        compareAtGbpPence: comparePence,
        platform,
        isActive: true,
        sortOrder: maxSort + 10,
      });
      setMessage(`Added ${name}`);
      setShowCreate(false);
      setNewCoins('100K');
      setNewName('');
      setNewSlug('');
      setNewPrice('');
      setNewCompare('');
      setSlugTouched(false);
      setNameTouched(false);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function deleteProduct(product: Product) {
    if (!user) return;
    const ok = window.confirm(`Delete “${product.name}”? This cannot be undone.`);
    if (!ok) return;
    setMessage(null);
    setError(null);
    setDeletingId(product.id);
    try {
      await api.deleteProduct(user.accessToken, product.id);
      setMessage(`Deleted ${product.name}`);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="animate-rise space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-lg bg-gold px-3 py-1.5 text-sm font-semibold text-black"
        >
          {showCreate ? 'Cancel' : 'Add product'}
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={(e) => void createProduct(e)}
          className="space-y-3 rounded-xl border border-gold/25 bg-[#12141a] p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white">
              New {platformLabel(platform)} product
            </p>
            <p className="text-xs text-white/40">Slug must be unique across all platforms</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <label className="text-xs text-white/50">
              Coins
              <input
                value={newCoins}
                onChange={(e) => setNewCoins(e.target.value)}
                placeholder="100K or 1.5M"
                className={fieldClass}
              />
            </label>
            <label className="text-xs text-white/50">
              Name
              <input
                value={newName}
                onChange={(e) => {
                  setNameTouched(true);
                  setNewName(e.target.value);
                }}
                placeholder="100K Safe Coins"
                className={fieldClass}
                required
              />
            </label>
            <label className="text-xs text-white/50">
              Slug
              <input
                value={newSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setNewSlug(e.target.value);
                }}
                placeholder="fc26-100k-ps"
                className={fieldClass}
                required
              />
            </label>
            <label className="text-xs text-white/50">
              Price (GBP)
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.70"
                className={fieldClass}
                required
              />
            </label>
            <label className="text-xs text-white/50">
              Compare at (GBP)
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={newCompare}
                onChange={(e) => setNewCompare(e.target.value)}
                placeholder="optional"
                className={fieldClass}
              />
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
            >
              {creating ? 'Adding…' : 'Create product'}
            </button>
          </div>
        </form>
      )}

      {fetching && products.length === 0 ? (
        <p className="text-sm text-white/45">Loading products…</p>
      ) : filteredProducts.length === 0 ? (
        <p className="rounded-xl border border-white/8 bg-[#12141a] px-4 py-10 text-center text-sm text-white/40">
          {products.length === 0
            ? 'No products for this platform yet. Add one above.'
            : 'No products match your search.'}
        </p>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <form
              key={product.id}
              onSubmit={(e) => void savePrice(e, product)}
              className="grid gap-3 rounded-xl border border-white/8 bg-[#12141a] p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:items-end"
            >
              <div>
                <p className="font-semibold text-white">{product.name}</p>
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
                  className={fieldClass}
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
                  className={fieldClass}
                />
              </label>
              <label className="text-xs text-white/50">
                Note
                <input
                  name="note"
                  defaultValue="Seasonal update"
                  className={fieldClass}
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-black"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => void deleteProduct(product)}
                  disabled={deletingId === product.id}
                  className="rounded-lg border border-danger/40 px-3 py-2 text-sm font-semibold text-danger transition hover:bg-danger/10 disabled:opacity-50"
                >
                  {deletingId === product.id ? '…' : 'Delete'}
                </button>
              </div>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
