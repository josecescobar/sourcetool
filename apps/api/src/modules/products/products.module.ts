import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { IntegrationsModule } from '../integrations/integrations.module';
import { ProductWatchesModule } from '../product-watches/product-watches.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [IntegrationsModule, ProductWatchesModule, AiModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
