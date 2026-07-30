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
        <h1 className="font-display text-4xl uppercase gold-txt">Pagamento recebido</h1>
        <p className="mt-3 text-white/70">
          Obrigado por comprar na {SITE.name}.
          {order ? (
            <>
              {' '}
              Pedido <strong>{order}</strong> confirmado.
            </>
          ) : null}{' '}
          Nossa equipe inicia a entrega em breve.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/account" className="gold-btn rounded-xl px-4 py-2 text-sm">
            Ver conta
          </Link>
          <a
            href={whatsappUrl(
              order
                ? `Olá Empire, acabei de pagar o pedido ${order}.`
                : 'Olá Empire, acabei de concluir o pagamento.',
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
