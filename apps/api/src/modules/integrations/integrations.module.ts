import { Module } from '@nestjs/common';
import { RainforestService } from './rainforest/rainforest.service';
import { KeepaService } from './keepa/keepa.service';
import { AmazonSpApiAuthService } from './amazon-sp-api/amazon-sp-api.auth';
import { AmazonSpApiService } from './amazon-sp-api/amazon-sp-api.service';
import { ProductDataChainService } from './product-data-chain.service';

@Module({
  providers: [
    RainforestService,
    KeepaService,
    AmazonSpApiAuthService,
    AmazonSpApiService,
    ProductDataChainService,
  ],
  exports: [
    RainforestService,
    KeepaService,
    AmazonSpApiService,
    ProductDataChainService,
  ],
})
export class IntegrationsModule {}
