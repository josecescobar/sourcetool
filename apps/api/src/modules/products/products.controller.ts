import { Controller, Get, Post, Query, Param, Body, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import type { Marketplace } from '@sourcetool/shared';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get('lookup')
  async lookup(
    @Query('identifier') identifier: string,
    @Query('marketplace') marketplace?: Marketplace,
  ) {
    return { success: true, data: await this.productsService.lookup(identifier, marketplace) };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return { success: true, data: await this.productsService.getById(id) };
  }

  @Get(':id/listings')
  async getListings(@Param('id') id: string) {
    return { success: true, data: await this.productsService.getListings(id) };
  }

  @Post('cross-match')
  async crossMatch(@Body() body: { identifier: string }) {
    return { success: true, data: await this.productsService.crossMatch(body.identifier) };
  }
}
