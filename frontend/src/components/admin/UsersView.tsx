'use client';

import { FormEvent, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatGbp } from '@/lib/admin-dashboard';
import { useAdminShell } from '@/components/admin/AdminShell';
import { OrderStatusBadge, ADMIN_ORDER_STATUSES } from '@/components/admin/OrdersTable';

type Customer = Awaited<ReturnType<typeof api.adminCustomers>>[number];

type UserFormMode = 'create' | 'edit';

type UserSortKey = 'name' | 'email' | 'role' | 'buyStatus';

type UserFormState = {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  role: 'customer' | 'admin';
};

type BuyInfo = {
  orderCount: number;
  latestStatus: string | null;
  spentPence: number;
  latestAt: number;
};

type Filters = {
  role: '' | 'customer' | 'admin';
  buyStatus: string;
};

const EMPTY_FORM: UserFormState = {
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  role: 'customer',
};

const EMPTY_FILTERS: Filters = {
  role: '',
  buyStatus: '',
};

const BUY_STATUS_OPTIONS = [
  { id: '', label: 'All buy statuses' },
  ...ADMIN_ORDER_STATUSES.map((s) => ({ id: s.status, label: s.label })),
] as const;

const PAID_STATUSES = new Set(['paid', 'processing', 'delivered']);

const ROW_GRID =
  'grid grid-cols-1 items-center gap-3 px-4 py-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.25fr)_6.5rem_minmax(0,1fr)_auto] md:gap-x-4 md:gap-y-3';

const fieldClass =
  'mt-1 w-full rounded-lg border border-white/10 bg-[#0b0c10] px-3 py-2 text-sm text-white';

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconEdit({ className }: { className?: string }) {
  return (
    <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function IconFilter({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 5h16l-6 7v5l-4 2v-7Z" />
    </svg>
  );
}

function IconEye({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
        <path d="m1 1 22 22" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function Avatar({
  name,
  email,
  url,
}: {
  name: string | null;
  email: string;
  url: string | null;
}) {
  const initial = (name || email || '?').trim().charAt(0).toUpperCase();
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold text-gold ${
        url ? 'bg-transparent' : 'bg-gold/15'
      }`}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-contain" />
      ) : (
        initial
      )}
    </div>
  );
}

function BuyStatus({
  orderCount,
  latestStatus,
  spentPence,
}: {
  orderCount: number;
  latestStatus: string | null;
  spentPence: number;
}) {
  if (orderCount === 0) {
    return (
      <div className="text-left">
        <span className="inline-flex items-center rounded-full bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-white/40 ring-1 ring-inset ring-white/10">
          No purchases
        </span>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-1 text-left">
      {latestStatus ? <OrderStatusBadge status={latestStatus} /> : null}
      <p className="text-[11px] text-white/40">
        {orderCount} order{orderCount === 1 ? '' : 's'}
        {spentPence > 0 ? ` · ${formatGbp(spentPence)} spent` : ''}
      </p>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  required,
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block text-xs text-white/50">
      {label}
      <span className="relative mt-1 block">
        <input
          required={required}
          type={visible ? 'text' : 'password'}
          minLength={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="w-full rounded-lg border border-white/10 bg-[#0b0c10] py-2 pl-3 pr-10 text-sm text-white"
          placeholder={placeholder}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-white/40 transition hover:text-white/80"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          <IconEye open={visible} />
        </button>
      </span>
    </label>
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

function SortHeaderButton({
  label,
  column,
  sortKey,
  sortDir,
  onSort,
  align = 'left',
}: {
  label: string;
  column: UserSortKey;
  sortKey: UserSortKey;
  sortDir: 'asc' | 'desc';
  onSort: (key: UserSortKey) => void;
  align?: 'left' | 'right';
}) {
  const active = sortKey === column;
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={`inline-flex items-center gap-1 font-semibold uppercase tracking-wide transition hover:text-white ${
        align === 'right' ? 'ml-auto flex-row-reverse' : ''
      } ${active ? 'text-gold' : 'text-white/35'}`}
    >
      {label}
      <span className="inline-flex w-3 justify-center text-[11px]" aria-hidden>
        {active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </button>
  );
}

function ConfirmModal({
  title,
  body,
  confirmLabel,
  confirmClassName,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  confirmClassName: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalOverlay>
      <div className="w-full max-w-sm space-y-4 rounded-xl border border-white/10 bg-[#12141a] p-5 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <div className="text-sm text-white/55">{body}</div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/60 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide disabled:opacity-50 ${confirmClassName}`}
          >
            {busy ? '…' : confirmLabel}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

export function UsersView() {
  const { user } = useAuth();
  const { search, orders, setMessage, setError } = useAdminShell();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [fetching, setFetching] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<UserFormMode | null>(null);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Customer | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState<UserSortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);

  async function refreshCustomers() {
    if (!user) return;
    const next = await api.adminCustomers(user.accessToken);
    setCustomers(next);
  }

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setFetching(true);
    void api
      .adminCustomers(user.accessToken)
      .then((data) => {
        if (!cancelled) setCustomers(data);
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
  }, [user, setError]);

  const buyByUserId = useMemo(() => {
    const byId = new Map<string, BuyInfo>();
    const byEmail = new Map<string, BuyInfo>();

    const bump = (map: Map<string, BuyInfo>, key: string, order: (typeof orders)[number]) => {
      const createdAt = new Date(order.created_at).getTime();
      const prev = map.get(key) ?? {
        orderCount: 0,
        latestStatus: null,
        spentPence: 0,
        latestAt: 0,
      };
      prev.orderCount += 1;
      if (PAID_STATUSES.has(order.status)) {
        prev.spentPence += order.total_gbp_pence ?? 0;
      }
      if (createdAt >= prev.latestAt) {
        prev.latestAt = createdAt;
        prev.latestStatus = order.status;
      }
      map.set(key, prev);
    };

    for (const order of orders) {
      if (order.user_id) bump(byId, order.user_id, order);
      const email = (order.profiles?.email ?? order.guest_email ?? '').toLowerCase();
      if (email) bump(byEmail, email, order);
    }

    return { byId, byEmail };
  }, [orders]);

  function buyFor(c: Customer): BuyInfo | null {
    return (
      buyByUserId.byId.get(c.id) ??
      buyByUserId.byEmail.get(c.email.toLowerCase()) ??
      null
    );
  }

  const hasActiveFilters = filters.role !== '' || filters.buyStatus !== '';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = customers.filter((c) => {
      const buy = buyFor(c);
      if (filters.role && c.role !== filters.role) return false;
      if (filters.buyStatus) {
        if ((buy?.latestStatus ?? '') !== filters.buyStatus) return false;
      }
      if (!q) return true;
      const buyLabel = buy?.latestStatus ?? (buy?.orderCount ? '' : 'no purchases');
      return [c.email, c.full_name, c.role, buyLabel]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });

    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const buyA = buyFor(a);
      const buyB = buyFor(b);
      let cmp = 0;
      switch (sortKey) {
        case 'email':
          cmp = a.email.localeCompare(b.email);
          break;
        case 'role': {
          cmp = a.role.localeCompare(b.role);
          if (cmp === 0) {
            const statusA = buyA?.latestStatus ?? '';
            const statusB = buyB?.latestStatus ?? '';
            cmp = statusA.localeCompare(statusB);
          }
          if (cmp === 0) cmp = (buyA?.spentPence ?? 0) - (buyB?.spentPence ?? 0);
          break;
        }
        case 'buyStatus': {
          const statusA = buyA?.latestStatus ?? (buyA?.orderCount ? 'zzz' : '');
          const statusB = buyB?.latestStatus ?? (buyB?.orderCount ? 'zzz' : '');
          cmp = statusA.localeCompare(statusB);
          if (cmp === 0) cmp = (buyA?.spentPence ?? 0) - (buyB?.spentPence ?? 0);
          break;
        }
        case 'name':
        default:
          cmp = (a.full_name || a.email).localeCompare(b.full_name || b.email);
          break;
      }
      return cmp * dir;
    });
    // buyFor depends on buyByUserId; include maps via customers/orders path
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, search, buyByUserId, filters, sortKey, sortDir]);

  function toggleSort(key: UserSortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir(key === 'buyStatus' ? 'desc' : 'asc');
  }

  function resetAvatarState(url: string | null = null) {
    setAvatarPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return url;
    });
    setAvatarFile(null);
    setAvatarBusy(false);
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormMode('create');
    resetAvatarState(null);
    setError(null);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({
      email: c.email,
      password: '',
      confirmPassword: '',
      fullName: c.full_name ?? '',
      role: c.role === 'admin' ? 'admin' : 'customer',
    });
    setFormMode('edit');
    resetAvatarState(c.avatar_url);
    setError(null);
  }

  function closeForm() {
    setFormMode(null);
    setEditing(null);
    setForm(EMPTY_FORM);
    setSaving(false);
    resetAvatarState(null);
  }

  async function onAvatarSelected(file: File | null) {
    if (!user || !file) return;
    setError(null);

    if (formMode === 'create') {
      const preview = URL.createObjectURL(file);
      setAvatarPreview((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return preview;
      });
      setAvatarFile(file);
      return;
    }

    if (!editing) return;
    setAvatarBusy(true);
    try {
      const updated = await api.adminUploadCustomerAvatar(
        user.accessToken,
        editing.id,
        file,
      );
      setEditing(updated);
      resetAvatarState(updated.avatar_url);
      await refreshCustomers();
      setMessage(`Avatar updated for ${updated.email}.`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAvatarBusy(false);
    }
  }

  async function onRemoveAvatar() {
    if (!user) return;
    setError(null);

    if (formMode === 'create') {
      resetAvatarState(null);
      return;
    }

    if (!editing) return;
    setAvatarBusy(true);
    try {
      const updated = await api.adminRemoveCustomerAvatar(
        user.accessToken,
        editing.id,
      );
      setEditing(updated);
      resetAvatarState(null);
      await refreshCustomers();
      setMessage(`Avatar removed for ${updated.email}.`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAvatarBusy(false);
    }
  }

  async function submitForm(e: FormEvent) {
    e.preventDefault();
    if (!user || !formMode) return;

    const password = form.password.trim();
    const confirm = form.confirmPassword.trim();
    if (formMode === 'create' || password || confirm) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (password !== confirm) {
        setError('Passwords do not match');
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      if (formMode === 'create') {
        const created = await api.createCustomer(user.accessToken, {
          email: form.email.trim(),
          password,
          fullName: form.fullName.trim() || undefined,
          role: form.role,
        });
        if (avatarFile) {
          await api.adminUploadCustomerAvatar(
            user.accessToken,
            created.id,
            avatarFile,
          );
        }
        setMessage(`Created user ${form.email.trim()}.`);
      } else if (editing) {
        const payload: {
          email?: string;
          password?: string;
          fullName?: string | null;
          role?: 'customer' | 'admin';
        } = {
          fullName: form.fullName.trim() || null,
          role: form.role,
        };
        if (form.email.trim().toLowerCase() !== editing.email.toLowerCase()) {
          payload.email = form.email.trim();
        }
        if (password) {
          payload.password = password;
        }
        await api.updateCustomer(user.accessToken, editing.id, payload);
        setMessage(`Updated ${form.email.trim()}.`);
      }
      await refreshCustomers();
      closeForm();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  async function deleteUser(c: Customer) {
    if (!user) return;
    if (c.id === user.id) {
      setConfirmDelete(null);
      setError('You cannot delete your own account. Sign in as another admin first.');
      return;
    }
    setBusyId(c.id);
    setError(null);
    try {
      await api.deleteCustomer(user.accessToken, c.id);
      setConfirmDelete(null);
      await refreshCustomers();
      setMessage(`Deleted ${c.email}.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  if (fetching && customers.length === 0) {
    return <p className="text-sm text-white/45">Loading users…</p>;
  }

  return (
    <div className="animate-rise space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-white/45">
          {filtered.length}
          {hasActiveFilters || search.trim() ? ` of ${customers.length}` : ''} user
          {filtered.length === 1 ? '' : 's'}
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gold text-black transition hover:bg-gold/90"
          aria-label="Add user"
          title="Add user"
        >
          <IconPlus />
        </button>
      </div>

      {filtersOpen ? (
        <div className="rounded-xl border border-white/8 bg-[#12141a] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/40">
              Filters
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="text-xs font-medium text-gold hover:underline"
              >
                Clear filters
              </button>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-white/50">
              Role
              <select
                value={filters.role}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    role: (e.target.value === 'admin' || e.target.value === 'customer'
                      ? e.target.value
                      : '') as Filters['role'],
                  }))
                }
                className={fieldClass}
              >
                <option value="">All roles</option>
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="text-xs text-white/50">
              Buy status
              <select
                value={filters.buyStatus}
                onChange={(e) => setFilters((f) => ({ ...f, buyStatus: e.target.value }))}
                className={fieldClass}
              >
                {BUY_STATUS_OPTIONS.map((s) => (
                  <option key={s.id || 'all'} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-white/8 bg-[#12141a]">
        <div
          className={`${ROW_GRID} hidden border-b border-white/6 bg-white/[0.02] text-[11px] md:grid`}
        >
          <SortHeaderButton
            label="User"
            column="name"
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
          />
          <SortHeaderButton
            label="Email"
            column="email"
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
          />
          <SortHeaderButton
            label="Role"
            column="role"
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
          />
          <SortHeaderButton
            label="Buy status"
            column="buyStatus"
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
          />
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              className={`inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[11px] font-semibold uppercase tracking-wide transition ${
                filtersOpen || hasActiveFilters
                  ? 'border-gold/40 bg-gold/10 text-gold'
                  : 'border-white/12 text-white/45 hover:border-white/25 hover:text-white/70'
              }`}
              aria-pressed={filtersOpen}
              title="Toggle filters"
            >
              <IconFilter />
              Filter
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 border-b border-white/6 px-4 py-2 md:hidden">
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold uppercase tracking-wide transition ${
              filtersOpen || hasActiveFilters
                ? 'border-gold/40 bg-gold/10 text-gold'
                : 'border-white/12 text-white/55'
            }`}
          >
            <IconFilter />
            Filter
          </button>
        </div>

        <ul className="divide-y divide-white/6">
          {filtered.map((c) => {
            const buy = buyFor(c);
            const isSelf = c.id === user?.id;
            return (
              <li key={c.id} className={ROW_GRID}>
                <div className="flex min-w-0 items-center gap-3 text-left">
                  <Avatar name={c.full_name} email={c.email} url={c.avatar_url} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {c.full_name || '—'}
                    </p>
                    {isSelf ? (
                      <p className="text-[11px] text-white/30">You</p>
                    ) : null}
                  </div>
                </div>

                <p className="min-w-0 truncate text-left text-sm text-white/50">{c.email}</p>

                <div className="flex justify-start text-left">
                  <span
                    className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                      c.role === 'admin'
                        ? 'bg-white/10 text-white'
                        : 'bg-white/[0.04] text-white/45'
                    }`}
                  >
                    {c.role}
                  </span>
                </div>

                <div className="min-w-0 justify-self-start text-left">
                  <BuyStatus
                    orderCount={buy?.orderCount ?? 0}
                    latestStatus={buy?.latestStatus ?? null}
                    spentPence={buy?.spentPence ?? 0}
                  />
                </div>

                <div className="flex items-center gap-1.5 md:justify-end">
                  <button
                    type="button"
                    disabled={busyId === c.id}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-white/70 transition hover:border-gold/40 hover:text-gold disabled:opacity-50"
                    onClick={() => openEdit(c)}
                    aria-label={`Edit ${c.email}`}
                    title="Edit"
                  >
                    <IconEdit />
                  </button>
                  <button
                    type="button"
                    disabled={busyId === c.id}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-danger/35 text-danger transition hover:border-danger hover:bg-danger/10 disabled:opacity-50"
                    onClick={() => setConfirmDelete(c)}
                    aria-label={`Delete ${c.email}`}
                    title="Delete"
                  >
                    <IconTrash />
                  </button>
                </div>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-white/40">
              No users found.
            </li>
          )}
        </ul>
      </div>

      {formMode ? (
        <ModalOverlay>
          <form
            onSubmit={(e) => void submitForm(e)}
            className="max-h-[min(90dvh,40rem)] w-full max-w-md space-y-4 overflow-y-auto rounded-xl border border-white/10 bg-[#12141a] p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {formMode === 'create' ? 'Add user' : 'Edit user'}
                </h2>
                <p className="mt-1 text-xs text-white/40">
                  {formMode === 'create'
                    ? 'Creates a login the customer can use immediately.'
                    : 'Leave password blank to keep the current password. Change role here if needed.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="text-xl leading-none text-white/40 transition hover:text-white"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/8 bg-[#0b0c10] px-3 py-3">
              <label className="relative cursor-pointer">
                <span
                  className={`relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full text-base font-semibold text-gold ${
                    avatarPreview ? 'bg-transparent' : 'bg-gold/15'
                  }`}
                >
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarPreview}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    (form.fullName || form.email || '?').trim().charAt(0).toUpperCase() ||
                    '?'
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-[#12141a] bg-[#12141a] text-[10px] text-white/70">
                    {avatarBusy ? '…' : '✎'}
                  </span>
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  disabled={avatarBusy || saving}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    e.target.value = '';
                    void onAvatarSelected(file);
                  }}
                />
              </label>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">Avatar</p>
                <p className="mt-0.5 text-[11px] text-white/40">
                  {formMode === 'create'
                    ? 'Optional. Uploaded after the account is created.'
                    : avatarPreview
                      ? 'Click the pencil to replace this photo.'
                      : 'Upload a JPG, PNG, WEBP, or GIF (max 2MB).'}
                </p>
              </div>
              {avatarPreview ? (
                <button
                  type="button"
                  disabled={avatarBusy || saving}
                  onClick={() => void onRemoveAvatar()}
                  className="shrink-0 text-xs font-semibold text-danger transition hover:text-danger/80 disabled:opacity-60"
                >
                  Remove
                </button>
              ) : (
                <label className="shrink-0 cursor-pointer text-xs font-semibold text-gold transition hover:text-gold/80">
                  Upload
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    disabled={avatarBusy || saving}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      e.target.value = '';
                      void onAvatarSelected(file);
                    }}
                  />
                </label>
              )}
            </div>

            <label className="block text-xs text-white/50">
              Full name
              <input
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                className={fieldClass}
                placeholder="Jane Doe"
              />
            </label>

            <label className="block text-xs text-white/50">
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={fieldClass}
                placeholder="user@example.com"
              />
            </label>

            <PasswordField
              label={formMode === 'create' ? 'Password' : 'New password'}
              value={form.password}
              onChange={(password) => setForm((f) => ({ ...f, password }))}
              required={formMode === 'create'}
              placeholder={formMode === 'create' ? 'At least 6 characters' : 'Optional'}
              autoComplete="new-password"
            />

            <PasswordField
              label={formMode === 'create' ? 'Confirm password' : 'Confirm new password'}
              value={form.confirmPassword}
              onChange={(confirmPassword) => setForm((f) => ({ ...f, confirmPassword }))}
              required={formMode === 'create' || form.password.length > 0}
              placeholder="Re-enter password"
              autoComplete="new-password"
            />

            <label className="block text-xs text-white/50">
              Role
              <select
                value={form.role}
                disabled={editing?.id === user?.id}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    role: e.target.value === 'admin' ? 'admin' : 'customer',
                  }))
                }
                className={`${fieldClass} disabled:opacity-50`}
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-gold px-3 py-2 text-xs font-semibold uppercase tracking-wide text-black disabled:opacity-50"
              >
                {saving ? 'Saving…' : formMode === 'create' ? 'Create user' : 'Save changes'}
              </button>
            </div>
          </form>
        </ModalOverlay>
      ) : null}

      {confirmDelete ? (
        <ConfirmModal
          title="Delete user?"
          body={
            <>
              This permanently removes{' '}
              <span className="font-medium text-white">{confirmDelete.email}</span> and
              their login. Existing orders stay in the system but will be unlinked.
            </>
          }
          confirmLabel={busyId === confirmDelete.id ? 'Deleting…' : 'Delete'}
          confirmClassName="bg-danger text-white"
          busy={busyId === confirmDelete.id}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => void deleteUser(confirmDelete)}
        />
      ) : null}
    </div>
  );
}
