'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatGbp } from '@/lib/admin-dashboard';
import { useAdminShell } from '@/components/admin/AdminShell';
import { OrderStatusBadge } from '@/components/admin/OrdersTable';

type Customer = Awaited<ReturnType<typeof api.adminCustomers>>[number];

type UserFormMode = 'create' | 'edit';

type UserFormState = {
  email: string;
  password: string;
  fullName: string;
  role: 'customer' | 'admin';
};

const EMPTY_FORM: UserFormState = {
  email: '',
  password: '',
  fullName: '',
  role: 'customer',
};

const PAID_STATUSES = new Set(['paid', 'processing', 'delivered']);

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
      <div className="min-w-0">
        <span className="inline-flex items-center rounded-full bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-white/40 ring-1 ring-inset ring-white/10">
          No purchases
        </span>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-1">
      {latestStatus ? <OrderStatusBadge status={latestStatus} /> : null}
      <p className="text-[11px] text-white/40">
        {orderCount} order{orderCount === 1 ? '' : 's'}
        {spentPence > 0 ? ` · ${formatGbp(spentPence)} spent` : ''}
      </p>
    </div>
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
    type BuyInfo = {
      orderCount: number;
      latestStatus: string | null;
      spentPence: number;
      latestAt: number;
    };
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

  function buyFor(c: Customer) {
    return (
      buyByUserId.byId.get(c.id) ??
      buyByUserId.byEmail.get(c.email.toLowerCase()) ??
      null
    );
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const buy = buyByUserId.byId.get(c.id) ?? buyByUserId.byEmail.get(c.email.toLowerCase());
      const buyLabel = buy?.latestStatus ?? (buy?.orderCount ? '' : 'no purchases');
      return [c.email, c.full_name, c.role, buyLabel]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [customers, search, buyByUserId]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormMode('create');
    setError(null);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({
      email: c.email,
      password: '',
      fullName: c.full_name ?? '',
      role: c.role === 'admin' ? 'admin' : 'customer',
    });
    setFormMode('edit');
    setError(null);
  }

  function closeForm() {
    setFormMode(null);
    setEditing(null);
    setForm(EMPTY_FORM);
    setSaving(false);
  }

  async function submitForm(e: FormEvent) {
    e.preventDefault();
    if (!user || !formMode) return;
    setSaving(true);
    setError(null);
    try {
      if (formMode === 'create') {
        await api.createCustomer(user.accessToken, {
          email: form.email.trim(),
          password: form.password,
          fullName: form.fullName.trim() || undefined,
          role: form.role,
        });
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
        if (form.password.trim()) {
          payload.password = form.password;
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

  async function changeRole(c: Customer) {
    if (!user || c.id === user.id) return;
    const nextRole = c.role === 'admin' ? 'customer' : 'admin';
    setBusyId(c.id);
    setError(null);
    try {
      await api.setCustomerRole(user.accessToken, c.id, nextRole);
      await refreshCustomers();
      setMessage(`${c.email} is now ${nextRole}.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(c: Customer) {
    if (!user || c.id === user.id) return;
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
          {filtered.length} user{filtered.length === 1 ? '' : 's'}
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-gold px-3 py-2 text-xs font-semibold uppercase tracking-wide text-black transition hover:bg-gold/90"
        >
          Add user
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/8 bg-[#12141a]">
        <ul className="divide-y divide-white/6">
          {filtered.map((c) => {
            const buy = buyFor(c);
            const isSelf = c.id === user?.id;
            return (
              <li
                key={c.id}
                className="grid grid-cols-1 items-center gap-3 px-4 py-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.1fr)_auto_minmax(0,1fr)_auto] lg:gap-4"
              >
                <div className="flex min-w-0 items-center gap-3">
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

                <p className="truncate text-sm text-white/50">{c.email}</p>

                <span
                  className={`inline-flex w-fit items-center rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                    c.role === 'admin'
                      ? 'bg-white/10 text-white'
                      : 'bg-white/[0.04] text-white/45'
                  }`}
                >
                  {c.role}
                </span>

                <BuyStatus
                  orderCount={buy?.orderCount ?? 0}
                  latestStatus={buy?.latestStatus ?? null}
                  spentPence={buy?.spentPence ?? 0}
                />

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <button
                    type="button"
                    disabled={busyId === c.id}
                    className="rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/70 transition hover:border-gold/40 hover:text-gold disabled:opacity-50"
                    onClick={() => openEdit(c)}
                  >
                    Edit
                  </button>
                  {!isSelf ? (
                    <>
                      <button
                        type="button"
                        disabled={busyId === c.id}
                        className="rounded-lg border border-gold/35 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10 disabled:opacity-50"
                        onClick={() => void changeRole(c)}
                      >
                        {busyId === c.id
                          ? '…'
                          : `Make ${c.role === 'admin' ? 'customer' : 'admin'}`}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === c.id}
                        className="rounded-lg border border-danger/35 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-danger transition hover:border-danger hover:bg-danger/10 disabled:opacity-50"
                        onClick={() => setConfirmDelete(c)}
                      >
                        Delete
                      </button>
                    </>
                  ) : null}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            onSubmit={(e) => void submitForm(e)}
            className="w-full max-w-md space-y-4 rounded-xl border border-white/10 bg-[#12141a] p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {formMode === 'create' ? 'Add user' : 'Edit user'}
                </h2>
                <p className="mt-1 text-xs text-white/40">
                  {formMode === 'create'
                    ? 'Creates a login the customer can use immediately.'
                    : 'Leave password blank to keep the current password.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="text-white/40 transition hover:text-white"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <label className="block text-xs text-white/50">
              Full name
              <input
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b0c10] px-3 py-2 text-sm text-white"
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
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b0c10] px-3 py-2 text-sm text-white"
                placeholder="user@example.com"
              />
            </label>

            <label className="block text-xs text-white/50">
              {formMode === 'create' ? 'Password' : 'New password'}
              <input
                required={formMode === 'create'}
                type="password"
                minLength={6}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b0c10] px-3 py-2 text-sm text-white"
                placeholder={formMode === 'create' ? 'At least 6 characters' : 'Optional'}
              />
            </label>

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
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b0c10] px-3 py-2 text-sm text-white disabled:opacity-50"
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
        </div>
      ) : null}

      {confirmDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm space-y-4 rounded-xl border border-white/10 bg-[#12141a] p-5 shadow-2xl">
            <h2 className="text-lg font-semibold text-white">Delete user?</h2>
            <p className="text-sm text-white/55">
              This permanently removes{' '}
              <span className="font-medium text-white">{confirmDelete.email}</span> and
              their login. Existing orders stay in the system but will be unlinked.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyId === confirmDelete.id}
                onClick={() => void deleteUser(confirmDelete)}
                className="rounded-lg bg-danger px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50"
              >
                {busyId === confirmDelete.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
