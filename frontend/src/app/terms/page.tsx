import type { Metadata } from 'next';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `Terms of Service for ${SITE.name}, operated by ${SITE.companyName}.`,
};

const sections = [
  {
    title: '1. Business details',
    body: [
      `${SITE.companyName} is a registered company in England and Wales.`,
      `Company Number: ${SITE.companyNumber}`,
      `Registered Contact: ${SITE.registeredContact}`,
      `Email: ${SITE.supportEmail}`,
    ],
  },
  {
    title: '2. Nature of service',
    body: [
      'We provide virtual currency allocation services via standard in-game auction market mechanisms for entertainment purposes. We are an independent marketplace. We are not affiliated with, authorised by, or endorsed by Electronic Arts Inc. (EA Sports) or any game publishers. All trademarks remain the property of their respective owners.',
    ],
  },
  {
    title: '3. Eligibility and account responsibility',
    body: [
      'By agreeing to these Terms of Service, you represent that you are at least the age of majority in your country or state of residence. You are responsible for ensuring the accuracy of the account and platform details provided during the checkout and player listing process.',
    ],
  },
  {
    title: '4. Pricing and payment',
    body: [
      'Prices for our products are subject to change without notice. Payments are securely processed. We reserve the right to refuse or cancel any order if fraudulent activity is suspected.',
    ],
  },
  {
    title: '5. In-game risks and limitations',
    body: [
      `The acquisition and trading of virtual currency carry inherent risks associated with the game publisher's rules. While we use advanced, human-guided auction methods to maximise delivery safety, ${SITE.companyName} is not responsible for any actions taken against your game account by third-party game publishers, including bans, resets, or restrictions. You proceed at your own risk.`,
    ],
  },
  {
    title: '6. Governing law',
    body: [
      'These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of England and Wales.',
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black pt-[72px] text-white">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="font-display text-xs uppercase tracking-[0.2em] text-gold">
          legal
        </p>
        <h1 className="mt-2 font-display text-4xl uppercase">
          terms of <span className="gold-txt">service</span>
        </h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-white/75">
          <p>Welcome to {SITE.name}.</p>
          <p>
            This website ({SITE.url}/) is operated by {SITE.companyName}. Throughout
            the site, the terms “we”, “us” and “our” refer to {SITE.companyName}. By
            visiting our site and/or purchasing virtual items from us, you engage in
            our “Service” and agree to be bound by the following terms and conditions.
          </p>
        </div>
        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-display text-sm uppercase tracking-[0.14em] text-gold">
                {section.title}
              </h2>
              <div className="mt-3 space-y-2 text-sm leading-relaxed text-white/75">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
