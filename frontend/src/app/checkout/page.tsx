'use client';

import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { formatGbp, SITE, whatsappUrl } from '@/lib/site';
import { SectionLink } from '@/components/SectionLink';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, platform, totalPence, clear } = useCart();
  const [guestEmail, setGuestEmail] = useState('');
  const [gameAccountEmail, setGameAccountEmail] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSynthetic = items.some((i) => i.product.id.startsWith('lootbar-'));

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-black pt-[72px] text-white">
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="font-display text-3xl uppercase">Cart is empty</h1>
          <SectionLink section="buy" className="mt-4 inline-block text-gold underline">
            Choose coins
          </SectionLink>
        </div>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (hasSynthetic) {
      window.location.href = whatsappUrl(
        `I want to buy ${items.map((i) => `${i.product.name} x${i.quantity}`).join(', ')} — total ${formatGbp(totalPence)}`,
      );
      return;
    }
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

  const inputClass =
    'mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-gold';

  return (
    <div className="min-h-screen bg-black pt-[72px] text-white">
      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-4xl uppercase">Checkout</h1>
        <p className="mt-2 text-sm text-white/60">
          Total: <strong className="text-gold">{formatGbp(totalPence)}</strong> · Stripe{' '}
          {SITE.currency}
        </p>

        {hasSynthetic && (
          <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 p-3 text-sm text-gold-l">
            Catalogue offline — finish on WhatsApp with LootBar reference prices.
          </p>
        )}

        <form
          onSubmit={onSubmit}
          className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
        >
          {!user && !hasSynthetic && (
            <label className="block text-sm">
              <span className="font-medium text-white/80">Email</span>
              <input
                required
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className={inputClass}
                placeholder="you@email.com"
              />
            </label>
          )}

          <label className="block text-sm">
            <span className="font-medium text-white/80">EA / game account email</span>
            <input
              type="email"
              value={gameAccountEmail}
              onChange={(e) => setGameAccountEmail(e.target.value)}
              className={inputClass}
              placeholder="Needed for delivery"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-white/80">WhatsApp (optional)</span>
            <input
              type="tel"
              value={customerWhatsapp}
              onChange={(e) => setCustomerWhatsapp(e.target.value)}
              className={inputClass}
              placeholder="For delivery updates"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-white/80">Delivery notes</span>
            <textarea
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="Platform ID, preferred delivery window, etc."
            />
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="gold-btn w-full rounded-xl py-3 text-sm disabled:opacity-60"
          >
            {loading
              ? 'Redirecting…'
              : hasSynthetic
                ? 'Continue on WhatsApp'
                : 'Pay with Stripe'}
          </button>
        </form>
      </div>
    </div>
  );
}
