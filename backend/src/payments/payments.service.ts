import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly frontendUrl: string;

  constructor(private readonly config: ConfigService) {
    this.stripe = new Stripe(this.config.getOrThrow<string>('STRIPE_SECRET_KEY'));
    this.frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
  }

  async createCheckoutSession(params: {
    orderId: string;
    orderNumber: string;
    email: string;
    lineItems: Array<{ name: string; amountPence: number; quantity: number }>;
  }) {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: params.email,
      currency: 'gbp',
      line_items: params.lineItems.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: 'gbp',
          unit_amount: item.amountPence,
          product_data: { name: item.name },
        },
      })),
      metadata: {
        orderId: params.orderId,
        orderNumber: params.orderNumber,
      },
      success_url: `${this.frontendUrl}/checkout/success?order=${params.orderNumber}`,
      cancel_url: `${this.frontendUrl}/checkout/cancel?order=${params.orderNumber}`,
    });

    if (!session.url) {
      throw new BadRequestException('Unable to create Stripe checkout session');
    }
    return session;
  }

  constructEvent(rawBody: Buffer, signature: string) {
    const secret = this.config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');
    return this.stripe.webhooks.constructEvent(rawBody, signature, secret);
  }
}
