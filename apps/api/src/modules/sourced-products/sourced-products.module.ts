import { Module } from '@nestjs/common';
import { SourcedProductsService } from './sourced-products.service';
import { SourcedProductsController } from './sourced-products.controller';

@Module({
  controllers: [SourcedProductsController],
  providers: [SourcedProductsService],
  exports: [SourcedProductsService],
})
export class SourcedProductsModule {}
