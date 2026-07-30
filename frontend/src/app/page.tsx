'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CoinCalculator } from '@/components/CoinCalculator';

const CARDS = [
  '/brand/mbappe-card-1.png',
  '/brand/bellingham-card-1.png',
  '/brand/musiala-card-1.png',
  '/brand/vandjik-card-1.png',
  '/brand/vinijr-card-1.png',
];

const TRUST = [
  { label: '4 YEARS', accent: 'IN THE MARKET', icon: 'clock' },
  { label: 'PAYMENT', accent: '100% SECURE', icon: 'lock' },
  { label: 'INSTANT', accent: 'DELIVERY', icon: 'check' },
  { label: 'ANTI-BAN', accent: 'GUARANTEED', icon: 'shield' },
] as const;

const STEPS = [
  {
    title: 'Choose your pack',
    body: 'Select your platform and the FC 26 coin amount you need.',
  },
  {
    title: 'Complete payment',
    body: 'Secure checkout. Once payment clears, we start delivery right away.',
  },
  {
    title: 'List a player',
    body: 'On the Transfer Market, we list or buy the agreed card with you.',
  },
  {
    title: 'Receive your coins',
    body: 'Coins arrive in your club via a safe trade - no risky bots.',
  },
  {
    title: 'Play with confidence',
    body: 'Anti-ban auction method with 24/7 WhatsApp support.',
  },
];

function useCountUp(target: number, active: boolean, duration = 1800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return value;
}

function TrustIcon({ name }: { name: (typeof TRUST)[number]['icon'] }) {
  const common = 'h-5 w-5 shrink-0 text-gold';
  if (name === 'clock') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === 'lock') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === 'check') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.5l2.5 2.5L16 9.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" strokeLinejoin="round" />
    </svg>
  );
}

export default function HomePage() {
  const [statsInView, setStatsInView] = useState(false);
  const clientes = useCountUp(5000, statsInView);
  const anos = useCountUp(4, statsInView);
  const antiBan = useCountUp(100, statsInView);

  useEffect(() => {
    const el = document.getElementById('hero-stats');
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsInView(true);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="bg-black text-white">
      {/* Hero: Neymar background on the right, copy + stats on the left */}
      <section className="relative min-h-[calc(100svh-96px)] overflow-hidden">
        <Image
          src="/brand/background-comprar-coins-eafc.png"
          alt=""
          fill
          priority
          className="hidden object-cover object-[72%_center] opacity-95 md:block"
        />
        <Image
          src="/brand/bg-mob-empire.png"
          alt=""
          fill
          priority
          className="object-cover object-center opacity-95 md:hidden"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/20 md:via-black/55 md:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

        <div className="relative mx-auto flex min-h-[calc(100svh-96px)] max-w-[1280px] flex-col justify-center px-4 py-12 sm:px-6 lg:py-16">
          <div className="animate-rise max-w-xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-black/45 px-3.5 py-1.5 font-display text-[11px] uppercase tracking-[0.18em] text-gold sm:text-xs">
              <span className="h-2 w-2 rounded-full bg-green shadow-[0_0_8px_rgba(0,230,118,.8)]" />
              ea fc 26 - unlimited stock
            </p>

            <h1 className="font-display text-[42px] leading-[0.95] uppercase sm:text-6xl md:text-7xl">
              <span className="block text-white">Build your</span>
              <span className="hero-dream block">dream squad</span>
            </h1>

            <p className="mt-5 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">
              Buy FIFA Coins with instant delivery, 100% anti-ban protection, and
              the best prices. More than 5,000 players trust Empire.
            </p>

            <Link
              href="#buy"
              className="gold-btn mt-8 inline-flex items-center gap-2.5 rounded-xl px-8 py-4 text-sm sm:text-base"
            >
              <svg viewBox="0 0 576 512" className="h-4 w-4 fill-current" aria-hidden>
                <path d="M528.12 301.319l47.273-208C578.806 78.301 567.391 64 551.99 64H111l-9.4-40.6C97.4 10.7 86.1 0 72.7 0H16C7.2 0 0 7.2 0 16s7.2 16 16 16h56.7l77.3 334.4c4.1 17.7 19.9 30.3 38.1 30.3H488c8.8 0 16-7.2 16-16s-7.2-16-16-16H188.1c-6.1 0-11.3-4.2-12.7-10.1L162.5 336H512c15.4 0 28.8-10.9 31.6-26.1zM176 464a48 48 0 1 0 96 0 48 48 0 1 0-96 0zm288 0a48 48 0 1 0 96 0 48 48 0 1 0-96 0z" />
              </svg>
              Buy Coins
            </Link>

            <div
              id="hero-stats"
              className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-8 sm:gap-8"
            >
              <div>
                <p className="font-display text-2xl text-gold sm:text-3xl">
                  {clientes.toLocaleString('en-GB')}+
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/55 sm:text-xs">
                  Customers
                </p>
              </div>
              <div>
                <p className="font-display text-2xl text-gold sm:text-3xl">
                  {anos} Years
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/55 sm:text-xs">
                  in the market
                </p>
              </div>
              <div>
                <p className="font-display text-2xl text-gold sm:text-3xl">
                  {antiBan}%
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/55 sm:text-xs">
                  Anti-ban
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-gold/15 bg-[#0a0a0a]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 py-5 sm:justify-between sm:px-6 lg:justify-around">
          {TRUST.map((item) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <TrustIcon name={item.icon} />
              <p className="font-display text-[11px] uppercase tracking-[0.12em] text-white/85 sm:text-xs">
                {item.label}{' '}
                <span className="text-gold">{item.accent}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="cards" className="overflow-hidden bg-[#0d0d0d] py-16">
        <div className="mx-auto max-w-[1280px] px-4 text-center sm:px-6">
          <p className="font-display text-xs uppercase tracking-[0.22em] text-gold">
            ea fc 26 - unlimited stock
          </p>
          <h2 className="mt-3 font-display text-3xl uppercase leading-tight sm:text-5xl">
            exclusive cards
            <br />
            <span className="gold-txt">are waiting for you!</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/65">
            With our coins you secure the best cards on the market and build the
            perfect Ultimate Team
          </p>
        </div>
        <div className="mt-10 overflow-hidden">
          <div className="animate-marquee flex w-max gap-6">
            {[...CARDS, ...CARDS].map((src, i) => (
              <Image
                key={`${src}-${i}`}
                src={src}
                alt=""
                width={180}
                height={240}
                className="h-[240px] w-auto rounded-md"
              />
            ))}
          </div>
        </div>
        <div className="mt-10 text-center">
          <Link
            href="#buy"
            className="gold-btn inline-flex rounded-xl px-8 py-4 text-sm"
          >
            Buy Coins
          </Link>
        </div>
      </section>

      <section id="buy" className="bg-black py-16 sm:py-20">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
          <div className="mb-10 text-center">
            <p className="font-display text-sm uppercase tracking-[0.18em] text-gold">
              Buy now
            </p>
            <h2 className="mt-2 font-display text-3xl uppercase sm:text-5xl">
              Choose your coins
            </h2>
            <p className="mt-3 text-white/60">
              Instant delivery after payment confirmation | prices referenced from
              LootBar FC 26
            </p>
          </div>
          <CoinCalculator />
        </div>
      </section>

      <section id="how-it-works" className="border-t border-gold/10 bg-[#0a0d14] py-16 sm:py-20">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
          <p className="font-display text-xs uppercase tracking-[0.2em] text-white/45">
            buying process
          </p>
          <h2 className="mt-2 font-display text-3xl uppercase sm:text-5xl">
            auction <span className="gold-txt">method</span>
          </h2>
          <p className="mt-3 max-w-2xl text-white/65">
            Safe delivery via the Transfer Market - in 5 steps you receive your
            coins
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-5">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="rounded-2xl border border-white/8 bg-white/[0.03] p-5"
              >
                <p className="font-display text-2xl text-gold">
                  0{i + 1}
                </p>
                <h3 className="mt-3 font-display text-sm uppercase tracking-wide">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-8 inline-flex items-center gap-2 font-display text-xs uppercase tracking-widest text-green">
            instant delivery
          </p>
        </div>
      </section>
    </div>
  );
}
