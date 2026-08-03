'use client';

import { useParams } from 'next/navigation';
import { ADMIN_SECTION_TO_TAB, type AdminTab } from '@/lib/admin-dashboard';
import { ComingSoon } from '@/components/admin/DashboardView';
import { OrdersView } from '@/components/admin/OrdersView';
import { ProductsView } from '@/components/admin/ProductsView';
import { UsersView } from '@/components/admin/UsersView';

const TITLES: Partial<Record<AdminTab, string>> = {
  coupons: 'Coupons',
  withdrawals: 'Withdrawals',
  support: 'Support',
  settings: 'Settings',
  logs: 'System Logs',
  reports: 'Reports',
  notifications: 'Notifications',
  backups: 'Backups',
};

export default function AdminSectionPage() {
  const params = useParams<{ section: string }>();
  const section = typeof params.section === 'string' ? params.section : '';
  const tab = ADMIN_SECTION_TO_TAB[section];

  if (!tab) {
    return (
      <div className="rounded-xl border border-white/8 bg-[#12141a] px-6 py-12 text-center">
        <p className="text-lg font-semibold text-white">Page not found</p>
        <p className="mt-2 text-sm text-white/45">
          No admin section named “{section || '…'}”.
        </p>
      </div>
    );
  }

  if (tab === 'customers') return <UsersView />;
  if (tab === 'orders') return <OrdersView showStats />;
  if (tab === 'transactions') return <OrdersView showStats={false} />;
  if (tab === 'products') return <ProductsView />;

  return <ComingSoon title={TITLES[tab] ?? section} />;
}
