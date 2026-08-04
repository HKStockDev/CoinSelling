import { Russo_One, Chakra_Petch, Plus_Jakarta_Sans } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/lib/cart';
import { AuthProvider } from '@/lib/auth';
import { AppChrome } from '@/components/AppChrome';
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

/** Admin UI — modern product sans (scoped via --font-admin-face) */
const admin = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-admin-face',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} | Buy EA FC 26 Coins`,
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
    icon: [{ url: '/brand/favi.png', type: 'image/png' }],
    apple: [{ url: '/brand/favi.png', type: 'image/png' }],
    shortcut: '/brand/favi.png',
  },
  openGraph: {
    title: `${SITE.name} | Buy EA FC 26 Coins`,
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
    <html lang="en" className={`${display.variable} ${body.variable} ${admin.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-black antialiased">
        <AuthProvider>
          <CartProvider>
            <AppChrome>{children}</AppChrome>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
