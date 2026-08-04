'use client';

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAdminShell } from '@/components/admin/AdminShell';
import { formatCoins, PLATFORMS, type Platform, type Product } from '@/lib/site';
import { platformMeta } from '@/lib/admin-dashboard';

const fieldClass =
  'mt-1 w-full rounded-lg border border-white/10 bg-[#0b0c10] px-2 py-2 text-sm text-white outline-none focus:border-gold/40';

const iconBtn =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition disabled:opacity-50';

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

function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function IconSave() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M17 21v-8H7v8M7 3v5h8" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function ModalOverlay({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <div className="admin-panel font-admin fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 antialiased">
      {children}
    </div>,
    document.body,
  );
}

type ConfirmState =
  | { kind: 'create' }
  | { kind: 'save'; product: Product; form: HTMLFormElement }
  | { kind: 'delete'; product: Product };

export function ProductsView() {
  const { user } = useAuth();
  const { search, setMessage, setError } = useAdminShell();
  const [platform, setPlatform] = useState<Platform>('ps4_ps5');
  const [products, setProducts] = useState<Product[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

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

  function resetCreateForm() {
    setNewCoins('100K');
    setNewName('');
    setNewSlug('');
    setNewPrice('');
    setNewCompare('');
    setSlugTouched(false);
    setNameTouched(false);
  }

  function requestOpenCreate() {
    setShowCreate((v) => !v);
  }

  function onSaveSubmit(e: FormEvent<HTMLFormElement>, product: Product) {
    e.preventDefault();
    setConfirm({ kind: 'save', product, form: e.currentTarget });
  }

  function onCreateSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setConfirm({ kind: 'create' });
  }

  async function runSave(product: Product, form: HTMLFormElement) {
    if (!user) return;
    setMessage(null);
    setError(null);
    const data = new FormData(form);
    const pounds = Number(data.get('price'));
    const compare = data.get('compare');
    const note = String(data.get('note') || 'Seasonal update');
    if (!Number.isFinite(pounds) || pounds <= 0) {
      setError('Enter a valid GBP price');
      setConfirm(null);
      return;
    }
    setBusy(true);
    try {
      await api.updatePrice(user.accessToken, product.id, {
        priceGbpPence: Math.round(pounds * 100),
        compareAtGbpPence:
          compare === '' || compare == null ? null : Math.round(Number(compare) * 100),
        note,
      });
      setMessage(`Updated ${product.name}`);
      setConfirm(null);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function runCreate() {
    if (!user) return;
    setMessage(null);
    setError(null);

    if (!Number.isFinite(coinAmount) || coinAmount < 1000) {
      setError('Enter a valid coin amount (e.g. 100K or 1.5M)');
      setConfirm(null);
      return;
    }
    const name = newName.trim();
    const slug = newSlug.trim().toLowerCase();
    const pounds = Number(newPrice);
    if (!name || !slug) {
      setError('Name and slug are required');
      setConfirm(null);
      return;
    }
    if (!Number.isFinite(pounds) || pounds <= 0) {
      setError('Enter a valid GBP price');
      setConfirm(null);
      return;
    }

    const compareRaw = newCompare.trim();
    const comparePence =
      compareRaw === '' ? null : Math.round(Number(compareRaw) * 100);
    if (compareRaw !== '' && (!Number.isFinite(Number(compareRaw)) || Number(compareRaw) <= 0)) {
      setError('Enter a valid compare-at price or leave it blank');
      setConfirm(null);
      return;
    }

    setBusy(true);
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
      resetCreateForm();
      setConfirm(null);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function runDelete(product: Product) {
    if (!user) return;
    setMessage(null);
    setError(null);
    setBusy(true);
    try {
      await api.deleteProduct(user.accessToken, product.id);
      setMessage(`Deleted ${product.name}`);
      setConfirm(null);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmAction() {
    if (!confirm) return;
    if (confirm.kind === 'create') {
      await runCreate();
      return;
    }
    if (confirm.kind === 'save') {
      await runSave(confirm.product, confirm.form);
      return;
    }
    await runDelete(confirm.product);
  }

  const confirmCopy = (() => {
    if (!confirm) return null;
    if (confirm.kind === 'create') {
      return {
        title: 'Create this product?',
        body: `Add “${newName.trim() || 'new product'}” (${newSlug.trim() || 'slug'}) for ${platformLabel(platform)}.`,
        action: busy ? 'Creating…' : 'Create',
        danger: false,
      };
    }
    if (confirm.kind === 'save') {
      return {
        title: 'Save price changes?',
        body: `Update pricing for “${confirm.product.name}”.`,
        action: busy ? 'Saving…' : 'Save',
        danger: false,
      };
    }
    return {
      title: 'Delete product?',
      body: `This permanently removes “${confirm.product.name}”. Existing orders stay, but the product link will be cleared.`,
      action: busy ? 'Deleting…' : 'Delete',
      danger: true,
    };
  })();

  return (
    <div className="animate-rise space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const meta = platformMeta(p.id);
            const active = platform === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatform(p.id)}
                title={p.label}
                aria-label={p.label}
                aria-pressed={active}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-lg transition ${
                  active
                    ? 'bg-gold text-black shadow-[0_0_0_1px_rgba(212,175,55,0.55)]'
                    : 'border border-white/10 text-white/70 hover:border-gold/40 hover:bg-white/5'
                }`}
              >
                <img
                  src={meta.icon}
                  alt=""
                  width={22}
                  height={22}
                  className={`h-[22px] w-[22px] object-contain ${active ? '' : 'opacity-80'}`}
                />
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={requestOpenCreate}
          className={`${iconBtn} bg-gold text-black hover:brightness-110`}
          aria-label={showCreate ? 'Close add product form' : 'Add product'}
          title={showCreate ? 'Close' : 'Add product'}
        >
          {showCreate ? <IconClose /> : <IconPlus />}
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={onCreateSubmit}
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
              disabled={busy}
              className={`${iconBtn} bg-gold text-black hover:brightness-110`}
              aria-label="Create product"
              title="Create product"
            >
              <IconPlus />
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
              onSubmit={(e) => onSaveSubmit(e, product)}
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
                  disabled={busy}
                  className={`${iconBtn} bg-gold text-black hover:brightness-110`}
                  aria-label={`Save ${product.name}`}
                  title="Save"
                >
                  <IconSave />
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirm({ kind: 'delete', product })}
                  className={`${iconBtn} border border-danger/40 text-danger hover:bg-danger/10`}
                  aria-label={`Delete ${product.name}`}
                  title="Delete"
                >
                  <IconTrash />
                </button>
              </div>
            </form>
          ))}
        </div>
      )}

      {confirm && confirmCopy ? (
        <ModalOverlay>
          <div className="w-full max-w-sm space-y-4 rounded-xl border border-white/10 bg-[#12141a] p-5 shadow-2xl">
            <h2 className="text-lg font-semibold text-white">{confirmCopy.title}</h2>
            <p className="text-sm text-white/55">{confirmCopy.body}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                disabled={busy}
                className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirmAction()}
                className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide disabled:opacity-50 ${
                  confirmCopy.danger
                    ? 'bg-danger text-white'
                    : 'bg-gold text-black'
                }`}
              >
                {confirmCopy.action}
              </button>
            </div>
          </div>
        </ModalOverlay>
      ) : null}
    </div>
  );
}
