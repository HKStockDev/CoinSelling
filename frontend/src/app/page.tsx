import Link from 'next/link';
import { SITE } from '@/lib/site';

export default function HomePage() {
  return (
    <>
      <section className="hero-glow relative min-h-[88vh] overflow-hidden text-cream">
        <div className="absolute inset-0 pitch-grid opacity-30" />
        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-center px-4 py-20 sm:px-6">
          <p className="animate-rise font-display text-5xl tracking-tight text-gold-bright sm:text-7xl md:text-8xl">
            {SITE.name}
          </p>
          <h1 className="animate-rise-delay mt-6 max-w-2xl font-display text-3xl leading-tight text-cream sm:text-4xl">
            FC 26 coins. Delivered fast. Paid in GBP.
          </h1>
          <p className="animate-rise-delay mt-4 max-w-xl text-base text-cream/75 sm:text-lg">
            Coins-only storefront for Ultimate Team. Choose your platform, pick a pack,
            checkout securely with Stripe.
          </p>
          <div className="animate-rise-delay mt-8 flex flex-wrap gap-3">
            <Link
              href="/buy"
              className="rounded-md bg-gold px-6 py-3 text-sm font-bold text-pitch-deep transition hover:bg-gold-bright"
            >
              Buy FC 26 coins
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-md border border-cream/30 px-6 py-3 text-sm font-semibold text-cream transition hover:border-gold hover:text-gold-bright"
            >
              How delivery works
            </Link>
          </div>
          <div
            aria-hidden
            className="animate-float pointer-events-none absolute right-[-4%] top-24 hidden h-56 w-56 rounded-full border border-gold/40 bg-gradient-to-br from-gold/30 to-transparent blur-[1px] md:block lg:right-8 lg:h-72 lg:w-72"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl text-pitch">Built for seasonal pricing</h2>
        <p className="mt-3 max-w-2xl text-ink/70">
          Market rates move every season. Admins can update GBP pack prices in seconds
          from the admin panel — no redeploy needed.
        </p>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {[
            {
              title: 'Safe trade focus',
              body: 'Comfort-style delivery guidance and WhatsApp support throughout the order.',
            },
            {
              title: 'GBP Stripe checkout',
              body: 'Card payments processed in British Pounds through Stripe Checkout.',
            },
            {
              title: 'Coins only',
              body: 'No cards, no boosts clutter — just FC 26 coin packs for PS, Xbox and PC.',
            },
          ].map((item) => (
            <div key={item.title}>
              <h3 className="font-display text-xl text-pitch">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
