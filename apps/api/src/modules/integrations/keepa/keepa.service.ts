import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Marketplace } from '@sourcetool/shared';
import type {
  ProductDataProvider,
  ExternalProductData,
} from '../interfaces/product-data-provider.interface';
import type { KeepaResponse } from './keepa.types';
import { mapKeepaProduct } from './keepa.mapper';
import {
  KEEPA_BASE_URL,
  KEEPA_DOMAIN_IDS,
  DEFAULT_MARKETPLACE,
} from './keepa.constants';

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

@Injectable()
export class KeepaService implements ProductDataProvider {
  private readonly logger = new Logger(KeepaService.name);
  private readonly apiKey: string | null;

  constructor(private configService: ConfigService) {
    const key = this.configService.get<string>('KEEPA_API_KEY');
    if (key) {
      this.apiKey = key;
      this.logger.log('Keepa API key configured');
    } else {
      this.apiKey = null;
      this.logger.warn(
        'KEEPA_API_KEY missing — Keepa product lookups disabled',
      );
    }
  }

  async getByAsin(
    asin: string,
    marketplace: Marketplace = DEFAULT_MARKETPLACE,
  ): Promise<ExternalProductData | null> {
    if (!this.apiKey) return null;

    const domainId = this.getDomainId(marketplace);
    if (domainId == null) return null;

    const params = new URLSearchParams({
      key: this.apiKey,
      domain: String(domainId),
      asin,
      stats: '180',
      offers: '20',
    });

    return this.fetchProduct(params, marketplace, `ASIN ${asin}`);
  }

  async searchByBarcode(
    barcode: string,
    type: 'UPC' | 'EAN',
    marketplace: Marketplace = DEFAULT_MARKETPLACE,
  ): Promise<ExternalProductData | null> {
    if (!this.apiKey) return null;

    const domainId = this.getDomainId(marketplace);
    if (domainId == null) return null;

    const params = new URLSearchParams({
      key: this.apiKey,
      domain: String(domainId),
      asin: barcode,
      product_code_is_asin: '0',
      stats: '180',
      offers: '20',
    });

    return this.fetchProduct(params, marketplace, `${type} ${barcode}`);
  }

  private async fetchProduct(
    params: URLSearchParams,
    marketplace: Marketplace,
    label: string,
  ): Promise<ExternalProductData | null> {
    const url = `${KEEPA_BASE_URL}?${params.toString()}`;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(url);

        if (!res.ok) {
          const isTransient = res.status === 429 || res.status >= 500;

          if (isTransient && attempt < MAX_RETRIES) {
            const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
            this.logger.warn(
              `Keepa API ${label}: HTTP ${res.status} — retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`,
            );
            await this.sleep(delay);
            continue;
          }

          this.logger.error(
            `Keepa API ${label}: HTTP ${res.status} ${res.statusText}`,
          );
          return null;
        }

        const data = (await res.json()) as KeepaResponse;

        if (!data.products?.length) {
          this.logger.debug(`Keepa API ${label}: no product returned`);
          return null;
        }

        const product = data.products[0]!;

        this.logger.debug(
          `Keepa API ${label}: OK (${data.tokensLeft} tokens remaining)`,
        );

        return mapKeepaProduct(product, marketplace);
      } catch (error) {
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
          this.logger.warn(
            `Keepa API ${label}: network error — retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`,
          );
          await this.sleep(delay);
          continue;
        }

        this.logger.error(
          `Keepa API ${label} failed after ${MAX_RETRIES} retries: ${error}`,
        );
        return null;
      }
    }

    return null;
  }

  private getDomainId(marketplace: Marketplace): number | null {
    const id = KEEPA_DOMAIN_IDS[marketplace];
    if (id == null) {
      this.logger.debug(`Keepa: unsupported marketplace ${marketplace}`);
      return null;
    }
    return id;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
