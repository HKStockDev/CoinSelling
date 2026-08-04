'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { CartDrawer } from '@/components/CartDrawer';
import {
  consumeHomeScrollSection,
  keepCleanHomeUrl,
  scrollToSection,
} from '@/lib/scroll-section';

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  useEffect(() => {
    if (pathname !== '/') return;

    const hash = window.location.hash.replace(/^#/, '');
    if (hash) {
      keepCleanHomeUrl();
      requestAnimationFrame(() => scrollToSection(hash));
      return;
    }

    const pending = consumeHomeScrollSection();
    if (pending) {
      requestAnimationFrame(() => scrollToSection(pending));
    }
  }, [pathname]);

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <CartDrawer />
      <WhatsAppFab />
    </>
  );
}
