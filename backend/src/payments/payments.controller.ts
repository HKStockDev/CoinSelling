import {
  Controller,
  Headers,
  Post,
  Req,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import Stripe from 'stripe';
import { Public } from '../common/decorators';
import { PaymentsService } from './payments.service';
import { OrdersService } from '../orders/orders.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    @Inject(forwardRef(() => OrdersService))
    private readonly orders: OrdersService,
  ) {}

  @Public()
  @Post('webhook')
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) throw new BadRequestException('Missing stripe-signature');
    if (!req.rawBody) throw new BadRequestException('Missing raw body');

    let event: Stripe.Event;
    try {
      event = this.payments.constructEvent(req.rawBody, signature);
    } catch (err) {
      throw new BadRequestException(
        `Webhook signature verification failed: ${(err as Error).message}`,
      );
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.orders.markPaid(
        session.id,
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id,
      );
    }

    return { received: true };
  }
}
