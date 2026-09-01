import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Marketplace } from '@sourcetool/shared';
import type {
  ProductDataProvider,
  ExternalProductData,
} from '../interfaces/product-data-provider.interface';
import type { RainforestResponse } from './rainforest.types';
import { mapRainforestProduct } from './rainforest.mapper';
import {
  RAINFOREST_BASE_URL,
  MARKETPLACE_AMAZON_DOMAIN,
  DEFAULT_MARKETPLACE,
} from './rainforest.constants';

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

@Injectable()
export class RainforestService implements ProductDataProvider {
  private readonly logger = new Logger(RainforestService.name);
  private readonly apiKey: string | null;

  constructor(private configService: ConfigService) {
    const key = this.configService.get<string>('RAINFOREST_API_KEY');
    if (key) {
      this.apiKey = key;
      this.logger.log('Rainforest API key configured');
    } else {
      this.apiKey = null;
      this.logger.warn(
        'RAINFOREST_API_KEY missing — external product lookups disabled',
      );
    }
  }

  async getByAsin(
    asin: string,
    marketplace: Marketplace = DEFAULT_MARKETPLACE,
  ): Promise<ExternalProductData | null> {
    if (!this.apiKey) return null;

    const domain = this.getDomain(marketplace);
    const params = new URLSearchParams({
      api_key: this.apiKey,
      type: 'product',
      asin,
      amazon_domain: domain,
    });

    return this.fetchProduct(params, marketplace, `ASIN ${asin}`);
  }

  async searchByBarcode(
    barcode: string,
    type: 'UPC' | 'EAN',
    marketplace: Marketplace = DEFAULT_MARKETPLACE,
  ): Promise<ExternalProductData | null> {
    if (!this.apiKey) return null;

    const domain = this.getDomain(marketplace);
    const params = new URLSearchParams({
      api_key: this.apiKey,
      type: 'product',
      gtin: barcode,
      amazon_domain: domain,
    });

    return this.fetchProduct(params, marketplace, `${type} ${barcode}`);
  }

  private async fetchProduct(
    params: URLSearchParams,
    marketplace: Marketplace,
    label: string,
  ): Promise<ExternalProductData | null> {
    const url = `${RAINFOREST_BASE_URL}?${params.toString()}`;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(url);

        if (!res.ok) {
          const isTransient =
            res.status === 429 || res.status >= 500;

          if (isTransient && attempt < MAX_RETRIES) {
            const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
            this.logger.warn(
              `Rainforest API ${label}: HTTP ${res.status} — retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`,
            );
            await this.sleep(delay);
            continue;
          }

          this.logger.error(
            `Rainforest API ${label}: HTTP ${res.status} ${res.statusText}`,
          );
          return null;
        }

        const data = (await res.json()) as RainforestResponse;

        if (!data.request_info?.success || !data.product) {
          this.logger.debug(`Rainforest API ${label}: no product returned`);
          return null;
        }

        this.logger.debug(
          `Rainforest API ${label}: OK (${data.request_info.credits_remaining} credits remaining)`,
        );

        return mapRainforestProduct(data.product, marketplace);
      } catch (error) {
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
          this.logger.warn(
            `Rainforest API ${label}: network error — retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`,
          );
          await this.sleep(delay);
          continue;
        }

        this.logger.error(`Rainforest API ${label} failed after ${MAX_RETRIES} retries: ${error}`);
        return null;
      }
    }

    return null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getDomain(marketplace: Marketplace): string {
    return (
      MARKETPLACE_AMAZON_DOMAIN[marketplace] ??
      MARKETPLACE_AMAZON_DOMAIN[DEFAULT_MARKETPLACE]!
    );
  }
}
