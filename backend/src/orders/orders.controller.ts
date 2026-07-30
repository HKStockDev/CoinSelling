import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CurrentUser, Public } from '../common/decorators';
import { AuthUser, PlatformType } from '../common/types';
import { OrdersService } from './orders.service';

class CheckoutItemBody {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

class CheckoutBody {
  @IsIn(['ps4_ps5', 'xbox', 'pc'])
  platform!: PlatformType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemBody)
  items!: CheckoutItemBody[];

  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @IsOptional()
  @IsEmail()
  gameAccountEmail?: string;

  @IsOptional()
  @IsString()
  customerWhatsapp?: string;

  @IsOptional()
  @IsString()
  deliveryNotes?: string;
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Public()
  @Post('checkout')
  checkout(@CurrentUser() user: AuthUser | undefined, @Body() body: CheckoutBody) {
    return this.ordersService.checkout({
      user,
      guestEmail: body.guestEmail,
      platform: body.platform,
      items: body.items,
      gameAccountEmail: body.gameAccountEmail,
      customerWhatsapp: body.customerWhatsapp,
      deliveryNotes: body.deliveryNotes,
    });
  }

  @Get('mine')
  myOrders(@CurrentUser() user: AuthUser) {
    return this.ordersService.listForUser(user.id);
  }

  @Get('mine/:id')
  myOrder(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.getForUser(user.id, id);
  }
}
