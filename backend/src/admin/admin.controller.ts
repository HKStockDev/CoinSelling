import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import { CurrentUser, Roles } from '../common/decorators';
import { AuthUser, OrderStatus, PlatformType } from '../common/types';
import { AdminService } from './admin.service';

class PriceUpdateDto {
  @IsInt()
  @Min(1)
  priceGbpPence!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  compareAtGbpPence?: number | null;

  @IsOptional()
  @IsString()
  note?: string;
}

class UpsertProductDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @MinLength(2)
  slug!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1000)
  coinAmount!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bonusCoins?: number;

  @IsInt()
  @Min(1)
  priceGbpPence!: number;

  @IsOptional()
  @IsNumber()
  compareAtGbpPence?: number | null;

  @IsIn(['ps4_ps5', 'xbox', 'pc'])
  platform!: PlatformType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

class OrderStatusDto {
  @IsIn([
    'pending_payment',
    'paid',
    'processing',
    'delivered',
    'cancelled',
    'refunded',
  ])
  status!: OrderStatus;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}

class RoleDto {
  @IsIn(['customer', 'admin'])
  role!: 'customer' | 'admin';
}

@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.adminService.dashboard();
  }

  @Get('products')
  products(@Query('platform') platform?: PlatformType) {
    return this.adminService.listProducts(platform);
  }

  @Patch('products/:id/price')
  updatePrice(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: PriceUpdateDto,
  ) {
    return this.adminService.updateProductPrice(
      user,
      id,
      body.priceGbpPence,
      body.compareAtGbpPence,
      body.note,
    );
  }

  @Post('products')
  upsertProduct(@Body() body: UpsertProductDto) {
    return this.adminService.upsertProduct(body);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.adminService.deleteProduct(id);
  }

  @Get('orders')
  orders(@Query('status') status?: OrderStatus) {
    return this.adminService.listOrders(status);
  }

  @Patch('orders/:id/status')
  updateOrder(@Param('id') id: string, @Body() body: OrderStatusDto) {
    return this.adminService.updateOrderStatus(id, body.status, body.adminNotes);
  }

  @Get('customers')
  customers() {
    return this.adminService.listCustomers();
  }

  @Patch('customers/:id/role')
  setRole(@Param('id') id: string, @Body() body: RoleDto) {
    return this.adminService.setCustomerRole(id, body.role);
  }
}
