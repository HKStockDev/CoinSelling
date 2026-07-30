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
  'PAGAMENTO 100% SEGURO',
  'entrega imediata',
  'anti-ban garantido',
  '4 anos de mercado',
];

const STEPS = [
  {
    title: 'Escolha o pacote',
    body: 'Selecione plataforma e a quantidade de coins FC 26 que você precisa.',
  },
  {
    title: 'Finalize o pagamento',
    body: 'Checkout seguro. Após a confirmação, iniciamos a entrega imediatamente.',
  },
  {
    title: 'Liste um jogador',
    body: 'No Mercado de Transferências, listamos/compramos o card combinado com você.',
  },
  {
    title: 'Receba as coins',
    body: 'As coins entram na sua conta via trade seguro — sem bots arriscados.',
  },
  {
    title: 'Jogue tranquilo',
    body: 'Anti-ban garantido com método leilão e suporte WhatsApp 24/7.',
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

export default function HomePage() {
  const [statsInView, setStatsInView] = useState(false);
  const clientes = useCountUp(5000, statsInView);
  const anos = useCountUp(4, statsInView);
  const antiBan = useCountUp(100, statsInView);

  useEffect(() => {
    const el = document.getElementById('stats');
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
      {/* Hero */}
      <section className="relative min-h-[100svh] overflow-hidden pt-[72px]">
        <Image
          src="/brand/background-comprar-coins-eafc.png"
          alt=""
          fill
          priority
          className="hidden object-cover object-center opacity-80 md:block"
        />
        <Image
          src="/brand/bg-mob-empire.png"
          alt=""
          fill
          priority
          className="object-cover object-center opacity-90 md:hidden"
        />
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative mx-auto grid min-h-[calc(100svh-72px)] max-w-[1280px] items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-rise max-w-xl">
            <p className="mb-4 font-display text-xs uppercase tracking-[0.22em] text-gold sm:text-sm">
              ea fc 26 - estoque ilimitado
            </p>
            <h1 className="font-display text-[42px] leading-[0.95] uppercase sm:text-6xl md:text-7xl">
              <span className="block">Monte seu</span>
              <span className="block gold-txt">time dos</span>
              <span className="block">sonhos</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">
              Compre FIFA Coins com entrega imediata, 100% anti-ban e o melhor
              preço. Mais de 5.000 jogadores confiam na Empire.
            </p>
            <Link
              href="#comprar"
              className="gold-btn mt-8 inline-flex rounded-xl px-8 py-4 text-sm sm:text-base"
            >
              Comprar Coins
            </Link>
          </div>

          <div className="animate-rise-delay relative hidden h-[520px] lg:block">
            {CARDS.map((src, i) => (
              <div
                key={src}
                className="animate-float-card absolute w-[180px] drop-shadow-[0_20px_50px_rgba(0,0,0,.65)]"
                style={{
                  left: `${8 + i * 14}%`,
                  top: `${12 + (i % 3) * 18}%`,
                  zIndex: 10 - i,
                  animationDelay: `${i * 0.35}s`,
                  rotate: `${-10 + i * 5}deg`,
                }}
              >
                <Image
                  src={src}
                  alt="Player card"
                  width={225}
                  height={300}
                  className="h-auto w-full"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-gold/15 bg-[#0a0a0a]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 py-5 sm:px-6">
          {TRUST.map((label) => (
            <p
              key={label}
              className="font-display text-[11px] uppercase tracking-[0.14em] text-gold/90 sm:text-xs"
            >
              {label}
            </p>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="bg-black py-16">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-4 text-center sm:grid-cols-3 sm:px-6">
          <div>
            <p className="font-display text-5xl gold-txt sm:text-6xl">
              {clientes}+
            </p>
            <p className="mt-2 text-sm uppercase tracking-widest text-white/55">
              Clientes
            </p>
          </div>
          <div>
            <p className="font-display text-5xl gold-txt sm:text-6xl">{anos}</p>
            <p className="mt-2 text-sm uppercase tracking-widest text-white/55">
              Anos no mercado
            </p>
          </div>
          <div>
            <p className="font-display text-5xl gold-txt sm:text-6xl">
              {antiBan}%
            </p>
            <p className="mt-2 text-sm uppercase tracking-widest text-white/55">
              Anti-ban
            </p>
          </div>
        </div>
      </section>

      {/* Cards teaser */}
      <section id="cards" className="overflow-hidden bg-[#0d0d0d] py-16">
        <div className="mx-auto max-w-[1280px] px-4 text-center sm:px-6">
          <p className="font-display text-xs uppercase tracking-[0.22em] text-gold">
            ea fc 26 - estoque ilimitado
          </p>
          <h2 className="mt-3 font-display text-3xl uppercase leading-tight sm:text-5xl">
            cards exclusivas
            <br />
            <span className="gold-txt">esperam por você!</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/65">
            Com nossas coins você garante os melhores cards do mercado e monta o
            time perfeito no Ultimate Team
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
            href="#comprar"
            className="gold-btn inline-flex rounded-xl px-8 py-4 text-sm"
          >
            Comprar Coins
          </Link>
        </div>
      </section>

      {/* Buy / Calculator */}
      <section id="comprar" className="bg-black py-16 sm:py-20">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
          <div className="mb-10 text-center">
            <p className="font-display text-sm uppercase tracking-[0.18em] text-gold">
              Compre Agora
            </p>
            <h2 className="mt-2 font-display text-3xl uppercase sm:text-5xl">
              Escolha suas coins
            </h2>
            <p className="mt-3 text-white/60">
              Entrega imediata após confirmação do pagamento · preços
              referenciados em LootBar FC 26
            </p>
          </div>
          <CoinCalculator />
        </div>
      </section>

      {/* Método leilão */}
      <section id="como-funciona" className="border-t border-gold/10 bg-[#0a0d14] py-16 sm:py-20">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
          <p className="font-display text-xs uppercase tracking-[0.2em] text-white/45">
            processo de compra
          </p>
          <h2 className="mt-2 font-display text-3xl uppercase sm:text-5xl">
            método <span className="gold-txt">leilão</span>
          </h2>
          <p className="mt-3 max-w-2xl text-white/65">
            Entrega segura via Mercado de Transferências — em 5 passos você
            recebe suas coins
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
            entrega imediata
          </p>
        </div>
      </section>
    </div>
  );
}
