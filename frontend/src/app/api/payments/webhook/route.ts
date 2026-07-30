import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getStripe } from '@/lib/stripe';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json(
      { message: 'Missing stripe-signature' },
      { status: 400 },
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { message: 'Missing STRIPE_WEBHOOK_SECRET' },
      { status: 500 },
    );
  }

  const rawBody = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      {
        message: `Webhook signature verification failed: ${(err as Error).message}`,
      },
      { status: 400 },
    );
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const admin = getSupabaseAdmin();

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    const { data: order } = await admin
      .from('orders')
      .select('*')
      .eq('stripe_checkout_session_id', session.id)
      .maybeSingle();

    if (order && order.status === 'pending_payment') {
      await admin
        .from('orders')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: paymentIntentId,
        })
        .eq('id', order.id);
    }
  }

  return NextResponse.json({ received: true });
}
