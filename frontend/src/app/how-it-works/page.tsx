import type { Metadata } from 'next';
import { SITE } from '@/lib/site';
import { SectionLink } from '@/components/SectionLink';

export const metadata: Metadata = {
  title: 'How it works',
  description: `How ${SITE.name} delivers FC 26 coins safely.`,
};

export default function HowItWorksPage() {
  const steps = [
    'Choose PlayStation, Xbox or PC and pick a coin pack.',
    'Add to cart and checkout with Stripe in GBP.',
    'Share your account details for auction-method delivery.',
    'Stay offline during the trade — we message you on WhatsApp when done.',
  ];

  return (
    <div className="min-h-screen bg-black pt-[72px] text-white">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="font-display text-xs uppercase tracking-[0.2em] text-gold">
          buying process
        </p>
        <h1 className="mt-2 font-display text-4xl uppercase">
          auction <span className="gold-txt">method</span>
        </h1>
        <p className="mt-3 text-white/65">
          Safe delivery via the Transfer Market — coins only, no player cards.
        </p>
        <ol className="mt-10 space-y-6">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-4">
              <span className="font-display text-3xl text-gold">0{index + 1}</span>
              <p className="pt-2 text-white/80">{step}</p>
            </li>
          ))}
        </ol>
        <SectionLink
          section="buy"
          className="gold-btn mt-10 inline-block rounded-xl px-5 py-3 text-sm"
        >
          Buy Coins
        </SectionLink>
      </div>
    </div>
  );
}
