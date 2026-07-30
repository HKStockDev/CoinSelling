import Link from 'next/link';
import { SITE, whatsappUrl } from '@/lib/site';

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-pitch/10 bg-pitch-deep text-cream">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl">
            {SITE.name}
            <span className="text-gold">.</span>
          </p>
          <p className="mt-3 max-w-xs text-sm text-cream/70">
            FC 26 coins only. Secure Stripe checkout in GBP. Fast manual delivery with WhatsApp support.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-gold">Explore</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-cream/80">
            <Link href="/buy" className="hover:text-gold-bright">
              Buy coins
            </Link>
            <Link href="/how-it-works" className="hover:text-gold-bright">
              How it works
            </Link>
            <Link href="/account" className="hover:text-gold-bright">
              My account
            </Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-gold">Support</p>
          <p className="mt-3 text-sm text-cream/80">WhatsApp {SITE.whatsappDisplay}</p>
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-semibold text-gold-bright hover:underline"
          >
            Message us on WhatsApp
          </a>
        </div>
      </div>
      <div className="border-t border-cream/10 px-4 py-4 text-center text-xs text-cream/50">
        © {new Date().getFullYear()} {SITE.name}. Not affiliated with EA Sports.
      </div>
    </footer>
  );
}
