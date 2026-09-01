import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { IntegrationsModule } from '../integrations/integrations.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [IntegrationsModule, AiModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
