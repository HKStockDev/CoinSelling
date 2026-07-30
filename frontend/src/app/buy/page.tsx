'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useCart } from '@/lib/cart';
import { formatCoins, type Product } from '@/lib/site';
import { PlatformPicker } from '@/components/PlatformPicker';
import { ProductCard } from '@/components/ProductCard';

export default function BuyPage() {
  const { platform, count } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .products(platform)
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [platform]);

  return (
    <div className="min-h-screen bg-black pt-[72px] text-white">
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.18em] text-gold">
              Pacotes FC 26
            </p>
            <h1 className="mt-2 font-display text-4xl uppercase">
              Comprar coins
            </h1>
            <p className="mt-2 max-w-xl text-white/60">
              Preços referenciados em LootBar. Escolha a plataforma e o pacote.
            </p>
          </div>
          {count > 0 && (
            <Link href="/cart" className="gold-btn rounded-xl px-4 py-2 text-sm">
              Ver carrinho ({count})
            </Link>
          )}
        </div>

        <div className="mt-8">
          <PlatformPicker />
        </div>

        {loading && <p className="mt-10 text-sm text-white/50">Carregando…</p>}
        {error && (
          <div className="mt-10 border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            Não foi possível carregar: {error}. Usando fallback da home se
            disponível.
          </div>
        )}

        {!loading && !error && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <p className="mt-10 text-sm text-white/50">
            Nenhum pacote ativo. Veja o calculador em{' '}
            <Link href="/#comprar" className="text-gold underline">
              Comprar
            </Link>
            .
          </p>
        )}

        <p className="mt-10 text-xs text-white/40">
          Dica: mantenha algumas mil coins na conta antes da entrega. Pacotes a
          partir de {formatCoins(100000)}.
        </p>
      </div>
    </div>
  );
}
