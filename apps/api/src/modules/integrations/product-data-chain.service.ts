import { Injectable, Logger } from '@nestjs/common';
import type { Marketplace } from '@sourcetool/shared';
import type {
  ProductDataProvider,
  ExternalProductData,
} from './interfaces/product-data-provider.interface';
import { RainforestService } from './rainforest/rainforest.service';
import { KeepaService } from './keepa/keepa.service';
import { AmazonSpApiService } from './amazon-sp-api/amazon-sp-api.service';

@Injectable()
export class ProductDataChainService implements ProductDataProvider {
  private readonly logger = new Logger(ProductDataChainService.name);
  private readonly providers: ProductDataProvider[];

  constructor(
    private rainforest: RainforestService,
    private keepa: KeepaService,
    private amazonSpApi: AmazonSpApiService,
  ) {
    this.providers = [this.rainforest, this.keepa, this.amazonSpApi];
  }

  async getByAsin(
    asin: string,
    marketplace?: Marketplace,
  ): Promise<ExternalProductData | null> {
    for (const provider of this.providers) {
      const result = await provider.getByAsin(asin, marketplace);
      if (result) return result;
      this.logger.debug(
        `${provider.constructor.name}.getByAsin(${asin}) returned null, trying next provider`,
      );
    }
    return null;
  }

  async searchByBarcode(
    barcode: string,
    type: 'UPC' | 'EAN',
    marketplace?: Marketplace,
  ): Promise<ExternalProductData | null> {
    for (const provider of this.providers) {
      const result = await provider.searchByBarcode(barcode, type, marketplace);
      if (result) return result;
      this.logger.debug(
        `${provider.constructor.name}.searchByBarcode(${barcode}) returned null, trying next provider`,
      );
    }
    return null;
  }
}
