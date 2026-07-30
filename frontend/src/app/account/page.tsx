'use client';

import { Suspense } from 'react';
import AccountClient from './AccountClient';

export default function AccountRoute() {
  return (
    <Suspense
      fallback={
        <p className="px-4 py-24 text-center text-sm text-white/55">Loading…</p>
      }
    >
      <AccountClient />
    </Suspense>
  );
}
