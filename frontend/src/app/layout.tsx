import { Russo_One, Chakra_Petch } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/lib/cart';
import { AuthProvider } from '@/lib/auth';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { CartDrawer } from '@/components/CartDrawer';
import { SITE } from '@/lib/site';

const display = Russo_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
});

const body = Chakra_Petch({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} – Coins para EA FC 26`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.tagline,
  keywords: [
    'FC 26 coins',
    'FIFA coins',
    'buy FC coins',
    'Ultimate Team coins',
    'FutCoins Empire',
  ],
  icons: {
    icon: '/brand/favi.png',
    apple: '/brand/favi.png',
  },
  openGraph: {
    title: `${SITE.name} – Coins para EA FC 26`,
    description: SITE.tagline,
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-black antialiased">
        <AuthProvider>
          <CartProvider>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <CartDrawer />
            <WhatsAppFab />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
