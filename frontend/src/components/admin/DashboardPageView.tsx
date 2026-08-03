'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { AdminDashboardData } from '@/lib/admin-dashboard';
import { useAdminShell } from '@/components/admin/AdminShell';
import { DashboardView } from '@/components/admin/DashboardView';

export function DashboardPageView() {
  const { user } = useAuth();
  const { setError } = useAdminShell();
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setFetching(true);
    void api
      .adminDashboard(user.accessToken)
      .then((data) => {
        if (!cancelled) setDashboard(data);
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

  if (fetching && !dashboard) {
    return <p className="text-sm text-white/45">Loading dashboard…</p>;
  }
  if (!dashboard) return null;
  return <DashboardView data={dashboard} />;
}
