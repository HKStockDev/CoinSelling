import Link from 'next/link';

export default async function CheckoutCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return (
    <div className="min-h-screen bg-black pt-[72px] text-white">
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-4xl uppercase">Checkout cancelado</h1>
        <p className="mt-3 text-white/70">
          Nenhum pagamento foi feito
          {order ? (
            <>
              {' '}
              para o pedido <strong>{order}</strong>
            </>
          ) : null}
          . Você pode voltar ao carrinho e tentar de novo.
        </p>
        <Link
          href="/cart"
          className="gold-btn mt-8 inline-block rounded-xl px-4 py-2 text-sm"
        >
          Voltar ao carrinho
        </Link>
      </div>
    </div>
  );
}
