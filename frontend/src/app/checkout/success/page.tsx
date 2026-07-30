import Link from 'next/link';
import { SITE, whatsappUrl } from '@/lib/site';

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return (
    <div className="min-h-screen bg-black pt-[72px] text-white">
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-4xl uppercase gold-txt">Payment received</h1>
        <p className="mt-3 text-white/70">
          Thanks for ordering with {SITE.name}.
          {order ? (
            <>
              {' '}
              Order <strong>{order}</strong> is confirmed.
            </>
          ) : null}{' '}
          Our team will start delivery shortly.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/account" className="gold-btn rounded-xl px-4 py-2 text-sm">
            View account
          </Link>
          <a
            href={whatsappUrl(
              order
                ? `Hi Empire, I just paid for order ${order}.`
                : 'Hi Empire, I just completed payment.',
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
