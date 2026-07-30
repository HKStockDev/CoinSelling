import { Bricolage_Grotesque, Figtree } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/lib/cart';
import { AuthProvider } from '@/lib/auth';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { SITE } from '@/lib/site';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
});

const body = Figtree({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} | Buy FC 26 Coins in GBP`,
    template: `%s | ${SITE.name}`,
  },
  description:
    'Buy EA FC 26 Ultimate Team coins safely with GBP Stripe checkout. PlayStation, Xbox and PC. Fast delivery and WhatsApp support.',
  keywords: [
    'FC 26 coins',
    'buy FC coins',
    'FIFA coins GBP',
    'Ultimate Team coins',
    'PS5 FC coins',
  ],
  openGraph: {
    title: `${SITE.name} | Buy FC 26 Coins`,
    description: SITE.tagline,
    type: 'website',
    locale: 'en_GB',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <AuthProvider>
          <CartProvider>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <WhatsAppFab />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
