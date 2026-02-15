import { Module } from '@nestjs/common';
import { RainforestService } from './rainforest/rainforest.service';
import { ProductDataChainService } from './product-data-chain.service';

@Module({
  providers: [RainforestService, ProductDataChainService],
  exports: [RainforestService, ProductDataChainService],
})
export class IntegrationsModule {}
