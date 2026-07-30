'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { formatGbp, SITE } from '@/lib/site';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, platform, totalPence, clear } = useCart();
  const [guestEmail, setGuestEmail] = useState('');
  const [gameAccountEmail, setGameAccountEmail] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl text-pitch">Nothing to checkout</h1>
        <Link href="/buy" className="mt-4 inline-block text-gold underline">
          Choose a coin pack
        </Link>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await api.checkout(
        {
          platform,
          items: items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
          })),
          guestEmail: user ? undefined : guestEmail,
          gameAccountEmail: gameAccountEmail || undefined,
          customerWhatsapp: customerWhatsapp || undefined,
          deliveryNotes: deliveryNotes || undefined,
        },
        user?.accessToken,
      );
      clear();
      window.location.href = result.checkoutUrl;
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl text-pitch">Checkout</h1>
      <p className="mt-2 text-sm text-ink/65">
        Total due: <strong>{formatGbp(totalPence)}</strong> · Paid securely via Stripe in{' '}
        {SITE.currency}
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4 border border-pitch/10 bg-white/80 p-5">
        {!user && (
          <label className="block text-sm">
            <span className="font-medium text-pitch">Email</span>
            <input
              required
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="mt-1 w-full border border-pitch/20 bg-cream px-3 py-2 outline-none focus:border-gold"
              placeholder="you@email.com"
            />
          </label>
        )}

        <label className="block text-sm">
          <span className="font-medium text-pitch">EA / game account email</span>
          <input
            type="email"
            value={gameAccountEmail}
            onChange={(e) => setGameAccountEmail(e.target.value)}
            className="mt-1 w-full border border-pitch/20 bg-cream px-3 py-2 outline-none focus:border-gold"
            placeholder="Needed for delivery"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-pitch">Your WhatsApp (optional)</span>
          <input
            type="tel"
            value={customerWhatsapp}
            onChange={(e) => setCustomerWhatsapp(e.target.value)}
            className="mt-1 w-full border border-pitch/20 bg-cream px-3 py-2 outline-none focus:border-gold"
            placeholder="For delivery updates"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-pitch">Delivery notes</span>
          <textarea
            value={deliveryNotes}
            onChange={(e) => setDeliveryNotes(e.target.value)}
            rows={3}
            className="mt-1 w-full border border-pitch/20 bg-cream px-3 py-2 outline-none focus:border-gold"
            placeholder="Platform ID, preferred delivery window, etc."
          />
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-pitch py-3 text-sm font-bold text-cream transition hover:bg-pitch-deep disabled:opacity-60"
        >
          {loading ? 'Redirecting to Stripe…' : 'Pay with Stripe'}
        </button>
      </form>
    </div>
  );
}
