import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Marketplace } from '@sourcetool/shared';
import type {
  ProductDataProvider,
  ExternalProductData,
} from '../interfaces/product-data-provider.interface';
import type {
  SpCatalogItemResponse,
  SpCompetitivePricingResponse,
  SpFeesEstimateResponse,
  SpSearchCatalogItemsResponse,
  SpFeesEstimateRequest,
} from './amazon-sp-api.types';
import { mapSpApiProduct } from './amazon-sp-api.mapper';
import type { SpApiMergedData } from './amazon-sp-api.mapper';
import { AmazonSpApiAuthService } from './amazon-sp-api.auth';
import {
  SP_API_MARKETPLACE_IDS,
  SP_API_REGIONAL_ENDPOINTS,
  SP_API_SANDBOX_ENDPOINTS,
  SP_API_CURRENCY,
  DEFAULT_MARKETPLACE,
} from './amazon-sp-api.constants';

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

@Injectable()
export class AmazonSpApiService implements ProductDataProvider {
  private readonly logger = new Logger(AmazonSpApiService.name);
  private readonly isSandbox: boolean;

  constructor(
    private configService: ConfigService,
    private auth: AmazonSpApiAuthService,
  ) {
    this.isSandbox =
      this.configService.get<string>('SP_API_SANDBOX') === 'true';

    if (this.auth.isConfigured()) {
      this.logger.log(
        `Amazon SP-API configured (${this.isSandbox ? 'SANDBOX' : 'production'} mode)`,
      );
    } else {
      this.logger.warn(
        'Amazon SP-API credentials missing — SP-API lookups disabled',
      );
    }
  }

  // ── ProductDataProvider interface ──────────────────────────────────

  async getByAsin(
    asin: string,
    marketplace: Marketplace = DEFAULT_MARKETPLACE,
  ): Promise<ExternalProductData | null> {
    if (!this.auth.isConfigured()) return null;

    const marketplaceId = this.getMarketplaceId(marketplace);
    if (!marketplaceId) return null;

    const token = await this.auth.getAccessToken();
    if (!token) return null;

    const baseUrl = this.getBaseUrl(marketplace);
    const label = `ASIN ${asin}`;

    const [catalog, pricing, fees] = await Promise.all([
      this.fetchCatalogItem(baseUrl, token, asin, marketplaceId, label),
      this.fetchCompetitivePricing(baseUrl, token, asin, marketplaceId, label),
      this.fetchFeesEstimate(
        baseUrl,
        token,
        asin,
        marketplaceId,
        marketplace,
        label,
      ),
    ]);

    if (!catalog) {
      this.logger.debug(`SP-API ${label}: no catalog item returned`);
      return null;
    }

    const merged: SpApiMergedData = { catalog, pricing, fees };
    return mapSpApiProduct(merged, marketplaceId, marketplace);
  }

  async searchByBarcode(
    barcode: string,
    type: 'UPC' | 'EAN',
    marketplace: Marketplace = DEFAULT_MARKETPLACE,
  ): Promise<ExternalProductData | null> {
    if (!this.auth.isConfigured()) return null;

    const marketplaceId = this.getMarketplaceId(marketplace);
    if (!marketplaceId) return null;

    const token = await this.auth.getAccessToken();
    if (!token) return null;

    const baseUrl = this.getBaseUrl(marketplace);
    const label = `${type} ${barcode}`;

    const searchParams = new URLSearchParams({
      marketplaceIds: marketplaceId,
      identifiers: barcode,
      identifiersType: type,
      includedData: 'summaries,identifiers,images,dimensions,salesRanks',
    });

    const url = `https://${baseUrl}/catalog/2022-04-01/items?${searchParams.toString()}`;
    const searchResult = await this.fetchWithRetry<SpSearchCatalogItemsResponse>(
      url,
      token,
      label,
    );

    if (
      !searchResult ||
      searchResult.numberOfResults === 0 ||
      !searchResult.items?.length
    ) {
      this.logger.debug(`SP-API ${label}: no results from catalog search`);
      return null;
    }

    const catalogItem = searchResult.items[0]!;
    const asin = catalogItem.asin;

    const [pricing, fees] = await Promise.all([
      this.fetchCompetitivePricing(baseUrl, token, asin, marketplaceId, label),
      this.fetchFeesEstimate(
        baseUrl,
        token,
        asin,
        marketplaceId,
        marketplace,
        label,
      ),
    ]);

    const merged: SpApiMergedData = { catalog: catalogItem, pricing, fees };
    return mapSpApiProduct(merged, marketplaceId, marketplace);
  }

  // ── Individual API fetchers ───────────────────────────────────────

  private async fetchCatalogItem(
    baseUrl: string,
    token: string,
    asin: string,
    marketplaceId: string,
    label: string,
  ): Promise<SpCatalogItemResponse | null> {
    const params = new URLSearchParams({
      marketplaceIds: marketplaceId,
      includedData: 'summaries,identifiers,images,dimensions,salesRanks',
    });
    const url = `https://${baseUrl}/catalog/2022-04-01/items/${asin}?${params.toString()}`;
    return this.fetchWithRetry<SpCatalogItemResponse>(
      url,
      token,
      `${label} catalog`,
    );
  }

  private async fetchCompetitivePricing(
    baseUrl: string,
    token: string,
    asin: string,
    marketplaceId: string,
    label: string,
  ): Promise<SpCompetitivePricingResponse | null> {
    const params = new URLSearchParams({
      Asins: asin,
      MarketplaceId: marketplaceId,
      ItemType: 'Asin',
    });
    const url = `https://${baseUrl}/products/pricing/v0/competitivePrice?${params.toString()}`;
    return this.fetchWithRetry<SpCompetitivePricingResponse>(
      url,
      token,
      `${label} pricing`,
    );
  }

  private async fetchFeesEstimate(
    baseUrl: string,
    token: string,
    asin: string,
    marketplaceId: string,
    marketplace: Marketplace,
    label: string,
  ): Promise<SpFeesEstimateResponse | null> {
    const currency = SP_API_CURRENCY[marketplace] ?? 'USD';
    const requestBody: SpFeesEstimateRequest = {
      FeesEstimateRequest: {
        MarketplaceId: marketplaceId,
        IdType: 'ASIN',
        IdValue: asin,
        IsAmazonFulfilled: true,
        PriceToEstimateFees: {
          ListingPrice: { CurrencyCode: currency, Amount: 15 },
        },
        Identifier: `fees-${asin}`,
      },
    };

    const url = `https://${baseUrl}/products/fees/v0/items/${asin}/feesEstimate`;
    return this.fetchWithRetry<SpFeesEstimateResponse>(
      url,
      token,
      `${label} fees`,
      'POST',
      JSON.stringify(requestBody),
    );
  }

  // ── Core fetch with retry ─────────────────────────────────────────

  private async fetchWithRetry<T>(
    url: string,
    token: string,
    label: string,
    method: 'GET' | 'POST' = 'GET',
    body?: string,
  ): Promise<T | null> {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const headers: Record<string, string> = {
          'x-amz-access-token': token,
          'Content-Type': 'application/json',
        };

        const res = await fetch(url, {
          method,
          headers,
          ...(body ? { body } : {}),
        });

        if (!res.ok) {
          const isTransient = res.status === 429 || res.status >= 500;

          if (isTransient && attempt < MAX_RETRIES) {
            const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
            this.logger.warn(
              `SP-API ${label}: HTTP ${res.status} — retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`,
            );
            await this.sleep(delay);
            continue;
          }

          this.logger.error(
            `SP-API ${label}: HTTP ${res.status} ${res.statusText}`,
          );
          return null;
        }

        return (await res.json()) as T;
      } catch (error) {
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
          this.logger.warn(
            `SP-API ${label}: network error — retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`,
          );
          await this.sleep(delay);
          continue;
        }

        this.logger.error(
          `SP-API ${label} failed after ${MAX_RETRIES} retries: ${error}`,
        );
        return null;
      }
    }

    return null;
  }

  // ── Helpers ───────────────────────────────────────────────────────

  private getMarketplaceId(marketplace: Marketplace): string | null {
    const id = SP_API_MARKETPLACE_IDS[marketplace];
    if (!id) {
      this.logger.debug(`SP-API: unsupported marketplace ${marketplace}`);
      return null;
    }
    return id;
  }

  private getBaseUrl(marketplace: Marketplace): string {
    const endpoints = this.isSandbox
      ? SP_API_SANDBOX_ENDPOINTS
      : SP_API_REGIONAL_ENDPOINTS;
    return (
      endpoints[marketplace] ??
      (this.isSandbox
        ? SP_API_SANDBOX_ENDPOINTS.AMAZON_US!
        : SP_API_REGIONAL_ENDPOINTS.AMAZON_US!)
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
