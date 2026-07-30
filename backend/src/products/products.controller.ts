import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../common/decorators';
import { PlatformType } from '../common/types';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  list(@Query('platform') platform?: PlatformType) {
    return this.productsService.list(platform);
  }

  @Public()
  @Get(':idOrSlug')
  getOne(@Param('idOrSlug') idOrSlug: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );
    return isUuid
      ? this.productsService.getById(idOrSlug)
      : this.productsService.getBySlug(idOrSlug);
  }
}
