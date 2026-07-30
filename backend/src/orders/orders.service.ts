import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthUser, PlatformType, Product } from '../common/types';
import { PaymentsService } from '../payments/payments.service';

export interface CheckoutItemDto {
  productId: string;
  quantity: number;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly supabase: SupabaseService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly payments: PaymentsService,
  ) {}

  private orderNumber() {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `CE-${stamp}-${rand}`;
  }

  async checkout(params: {
    user?: AuthUser;
    guestEmail?: string;
    platform: PlatformType;
    items: CheckoutItemDto[];
    gameAccountEmail?: string;
    customerWhatsapp?: string;
    deliveryNotes?: string;
  }) {
    if (!params.items?.length) {
      throw new BadRequestException('Cart is empty');
    }
    if (!params.user && !params.guestEmail) {
      throw new BadRequestException('Email is required for guest checkout');
    }

    const productIds = params.items.map((i) => i.productId);
    const { data: products, error } = await this.supabase.db
      .from('products')
      .select('*')
      .in('id', productIds)
      .eq('is_active', true);

    if (error) throw error;
    const productMap = new Map(
      ((products ?? []) as Product[]).map((p) => [p.id, p]),
    );

    let subtotal = 0;
    const lineItems = params.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(`Invalid product: ${item.productId}`);
      }
      if (product.platform !== params.platform) {
        throw new BadRequestException(
          `Product ${product.name} does not match selected platform`,
        );
      }
      const qty = Math.max(1, Math.floor(item.quantity || 1));
      subtotal += product.price_gbp_pence * qty;
      return { product, quantity: qty };
    });

    const orderNumber = this.orderNumber();
    const { data: order, error: orderError } = await this.supabase.db
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: params.user?.id ?? null,
        guest_email: params.user ? null : params.guestEmail,
        status: 'pending_payment',
        platform: params.platform,
        subtotal_gbp_pence: subtotal,
        total_gbp_pence: subtotal,
        currency: 'gbp',
        game_account_email: params.gameAccountEmail ?? null,
        customer_whatsapp: params.customerWhatsapp ?? null,
        delivery_notes: params.deliveryNotes ?? null,
      })
      .select('*')
      .single();

    if (orderError) throw new BadRequestException(orderError.message);

    const { error: itemsError } = await this.supabase.db
      .from('order_items')
      .insert(
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

    if (itemsError) throw new BadRequestException(itemsError.message);

    const session = await this.payments.createCheckoutSession({
      orderId: order.id,
      orderNumber: order.order_number,
      email: params.user?.email ?? params.guestEmail!,
      lineItems: lineItems.map(({ product, quantity }) => ({
        name: `${product.name} (${product.platform})`,
        amountPence: product.price_gbp_pence,
        quantity,
      })),
    });

    await this.supabase.db
      .from('orders')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', order.id);

    return {
      orderId: order.id,
      orderNumber: order.order_number,
      checkoutUrl: session.url,
      totalGbpPence: subtotal,
    };
  }

  async listForUser(userId: string) {
    const { data, error } = await this.supabase.db
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async getForUser(userId: string, orderId: string) {
    const { data, error } = await this.supabase.db
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Order not found');
    return data;
  }

  async markPaid(sessionId: string, paymentIntentId?: string) {
    const { data: order, error } = await this.supabase.db
      .from('orders')
      .select('*')
      .eq('stripe_checkout_session_id', sessionId)
      .maybeSingle();
    if (error) throw error;
    if (!order) return null;
    if (order.status !== 'pending_payment') return order;

    const { data: updated, error: updateError } = await this.supabase.db
      .from('orders')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: paymentIntentId ?? null,
      })
      .eq('id', order.id)
      .select('*')
      .single();
    if (updateError) throw updateError;
    return updated;
  }
}
