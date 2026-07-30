import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Como Funciona',
  description: `Como a ${SITE.name} entrega coins FC 26 com segurança.`,
};

export default function HowItWorksPage() {
  const steps = [
    'Escolha PlayStation, Xbox ou PC e o pacote de coins.',
    'Adicione ao carrinho e pague com Stripe em GBP.',
    'Envie os dados da conta para a entrega via método leilão.',
    'Fique offline durante o trade — avisamos no WhatsApp quando terminar.',
  ];

  return (
    <div className="min-h-screen bg-black pt-[72px] text-white">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="font-display text-xs uppercase tracking-[0.2em] text-gold">
          processo de compra
        </p>
        <h1 className="mt-2 font-display text-4xl uppercase">
          método <span className="gold-txt">leilão</span>
        </h1>
        <p className="mt-3 text-white/65">
          Entrega segura via Mercado de Transferências — coins only, sem cards.
        </p>
        <ol className="mt-10 space-y-6">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-4">
              <span className="font-display text-3xl text-gold">0{index + 1}</span>
              <p className="pt-2 text-white/80">{step}</p>
            </li>
          ))}
        </ol>
        <Link
          href="/#comprar"
          className="gold-btn mt-10 inline-block rounded-xl px-5 py-3 text-sm"
        >
          Comprar Coins
        </Link>
      </div>
    </div>
  );
}
