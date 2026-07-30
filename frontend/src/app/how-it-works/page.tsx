import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'How it works',
  description: `How ${SITE.name} delivers FC 26 coins safely after GBP Stripe payment.`,
};

export default function HowItWorksPage() {
  const steps = [
    'Choose PlayStation, Xbox or PC and pick a coin pack.',
    'Add to cart and checkout with Stripe in GBP.',
    'Share your game account details for delivery.',
    'Stay offline during transfer — we message you on WhatsApp when done.',
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl text-pitch">How it works</h1>
      <p className="mt-3 text-ink/70">
        Simple buying flow focused on coins only — no player cards or boost services.
      </p>
      <ol className="mt-10 space-y-6">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-4">
            <span className="font-display text-3xl text-gold">{index + 1}</span>
            <p className="pt-2 text-ink/80">{step}</p>
          </li>
        ))}
      </ol>
      <Link
        href="/buy"
        className="mt-10 inline-block rounded-md bg-gold px-5 py-3 text-sm font-bold text-pitch-deep"
      >
        Start buying
      </Link>
    </div>
  );
}
