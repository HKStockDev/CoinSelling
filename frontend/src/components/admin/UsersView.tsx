'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAdminShell } from '@/components/admin/AdminShell';

type Customer = Awaited<ReturnType<typeof api.adminCustomers>>[number];

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

export function UsersView() {
  const { user } = useAuth();
  const { search, setMessage, setError } = useAdminShell();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [fetching, setFetching] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.email, c.full_name, c.role].filter(Boolean).join(' ').toLowerCase().includes(q),
    );
  }, [customers, search]);

  async function changeRole(c: Customer) {
    if (!user || c.id === user.id) return;
    const nextRole = c.role === 'admin' ? 'customer' : 'admin';
    setBusyId(c.id);
    setError(null);
    try {
      await api.setCustomerRole(user.accessToken, c.id, nextRole);
      const next = await api.adminCustomers(user.accessToken);
      setCustomers(next);
      setMessage(`${c.email} is now ${nextRole}.`);
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
    <div className="animate-rise overflow-hidden rounded-xl border border-white/8 bg-[#12141a]">
      <ul className="divide-y divide-white/6">
        {filtered.map((c) => (
          <li
            key={c.id}
            className="grid grid-cols-1 items-center gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_auto_auto] sm:gap-4"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={c.full_name} email={c.email} url={c.avatar_url} />
              <p className="truncate text-sm font-semibold text-white">
                {c.full_name || '—'}
              </p>
            </div>

            <p className="truncate text-sm text-white/50 sm:pl-0">{c.email}</p>

            <span
              className={`inline-flex w-fit items-center rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                c.role === 'admin'
                  ? 'bg-white/10 text-white'
                  : 'bg-white/[0.04] text-white/45'
              }`}
            >
              {c.role}
            </span>

            <div className="sm:justify-self-end">
              {c.id !== user?.id ? (
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
              ) : (
                <span className="text-[11px] text-white/30">You</span>
              )}
            </div>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="px-4 py-10 text-center text-sm text-white/40">No users found.</li>
        )}
      </ul>
    </div>
  );
}
