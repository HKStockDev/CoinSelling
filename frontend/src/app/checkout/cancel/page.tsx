import Link from 'next/link';

export default async function CheckoutCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <h1 className="font-display text-4xl text-pitch">Checkout cancelled</h1>
      <p className="mt-3 text-ink/70">
        No payment was taken
        {order ? (
          <>
            {' '}
            for order <strong>{order}</strong>
          </>
        ) : null}
        . You can return to your cart and try again.
      </p>
      <Link
        href="/cart"
        className="mt-8 inline-block rounded-md bg-pitch px-4 py-2 text-sm font-semibold text-cream"
      >
        Back to cart
      </Link>
    </div>
  );
}
