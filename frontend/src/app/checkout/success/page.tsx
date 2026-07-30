import Link from 'next/link';
import { SITE, whatsappUrl } from '@/lib/site';

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <h1 className="font-display text-4xl text-pitch">Payment received</h1>
      <p className="mt-3 text-ink/70">
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
        <Link
          href="/account"
          className="rounded-md bg-pitch px-4 py-2 text-sm font-semibold text-cream"
        >
          View account
        </Link>
        <a
          href={whatsappUrl(
            order
              ? `Hi CoinEmpire, I just paid for order ${order}.`
              : 'Hi CoinEmpire, I just completed payment.',
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-pitch/20 px-4 py-2 text-sm font-semibold text-pitch"
        >
          Message WhatsApp
        </a>
      </div>
    </div>
  );
}
