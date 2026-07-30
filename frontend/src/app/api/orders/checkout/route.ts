import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getStripe, siteUrl } from '@/lib/stripe';
import type { Platform, Product } from '@/lib/site';

type CheckoutBody = {
  platform: Platform;
  items: Array<{ productId: string; quantity: number }>;
  guestEmail?: string;
  gameAccountEmail?: string;
  customerWhatsapp?: string;
  deliveryNotes?: string;
};

function orderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CE-${stamp}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutBody;
    if (!body.items?.length) {
      return NextResponse.json({ message: 'Cart is empty' }, { status: 400 });
    }
    if (!['ps4_ps5', 'xbox', 'pc'].includes(body.platform)) {
      return NextResponse.json({ message: 'Invalid platform' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    const admin = getSupabaseAdmin();
    let userId: string | null = null;
    let userEmail: string | null = null;

    if (token) {
      const { data, error } = await admin.auth.getUser(token);
      if (!error && data.user) {
        userId = data.user.id;
        userEmail = data.user.email ?? null;
      }
    }

    const email = userEmail ?? body.guestEmail ?? null;
    if (!email) {
      return NextResponse.json(
        { message: 'Email is required for guest checkout' },
        { status: 400 },
      );
    }

    const productIds = body.items.map((i) => i.productId);
    const { data: products, error: productsError } = await admin
      .from('products')
      .select('*')
      .in('id', productIds)
      .eq('is_active', true);

    if (productsError) {
      return NextResponse.json(
        { message: productsError.message },
        { status: 400 },
      );
    }

    const productMap = new Map(
      ((products ?? []) as Product[]).map((p) => [p.id, p]),
    );

    let subtotal = 0;
    const lineItems = body.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) throw new Error(`Invalid product: ${item.productId}`);
      if (product.platform !== body.platform) {
        throw new Error(
          `Product ${product.name} does not match selected platform`,
        );
      }
      const quantity = Math.max(1, Math.floor(item.quantity || 1));
      subtotal += product.price_gbp_pence * quantity;
      return { product, quantity };
    });

    const number = orderNumber();
    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        order_number: number,
        user_id: userId,
        guest_email: userId ? null : body.guestEmail,
        status: 'pending_payment',
        platform: body.platform,
        subtotal_gbp_pence: subtotal,
        total_gbp_pence: subtotal,
        currency: 'gbp',
        game_account_email: body.gameAccountEmail ?? null,
        customer_whatsapp: body.customerWhatsapp ?? null,
        delivery_notes: body.deliveryNotes ?? null,
      })
      .select('*')
      .single();

    if (orderError) {
      return NextResponse.json({ message: orderError.message }, { status: 400 });
    }

    const { error: itemsError } = await admin.from('order_items').insert(
      lineItems.map(({ product, quantity }) => ({
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        coin_amount: product.coin_amount,
        bonus_coins: product.bonus_coins,
        unit_price_gbp_pence: product.price_gbp_pence,
        quantity,
      })),
    );

    if (itemsError) {
      return NextResponse.json({ message: itemsError.message }, { status: 400 });
    }

    const stripe = getStripe();
    const base = siteUrl();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      currency: 'gbp',
      line_items: lineItems.map(({ product, quantity }) => ({
        quantity,
        price_data: {
          currency: 'gbp',
          unit_amount: product.price_gbp_pence,
          product_data: {
            name: `${product.name} (${product.platform})`,
          },
        },
      })),
      metadata: {
        orderId: order.id,
        orderNumber: order.order_number,
      },
      success_url: `${base}/checkout/success?order=${order.order_number}`,
      cancel_url: `${base}/checkout/cancel?order=${order.order_number}`,
    });

    if (!session.url) {
      return NextResponse.json(
        { message: 'Unable to create Stripe checkout session' },
        { status: 500 },
      );
    }

    await admin
      .from('orders')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', order.id);

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      checkoutUrl: session.url,
      totalGbpPence: subtotal,
    });
  } catch (err) {
    return NextResponse.json(
      { message: (err as Error).message || 'Checkout failed' },
      { status: 400 },
    );
  }
}
