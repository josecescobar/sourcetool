import type { ApiClient } from './api-client';
import { CacheManager } from './cache';

export type MessageType =
  | 'PRODUCT_DETECTED'
  | 'LOOKUP_PRODUCT'
  | 'CALCULATE_PROFIT'
  | 'GET_DEAL_SCORE'
  | 'GET_HISTORY'
  | 'CHECK_ALERTS'
  | 'GET_AUTH_TOKEN'
  | 'SET_AUTH_TOKEN'
  | 'ANALYZE_SELECTION';

export interface ExtensionMessage {
  type: MessageType;
  data?: any;
}

export class MessageRouter {
  private cache = new CacheManager();

  constructor(private api: ApiClient) {}

  async handle(message: ExtensionMessage, sender: chrome.runtime.MessageSender): Promise<any> {
    switch (message.type) {
      case 'PRODUCT_DETECTED':
        return this.handleProductDetected(message.data);
      case 'LOOKUP_PRODUCT':
        return this.handleLookup(message.data);
      case 'CALCULATE_PROFIT':
        return this.api.post('/analysis/calculate', message.data);
      case 'GET_DEAL_SCORE':
        return this.api.post('/ai/deal-score', message.data);
      case 'GET_HISTORY':
        return this.api.get(`/history/price/${message.data.productId}?days=${message.data.days || 90}`);
      case 'CHECK_ALERTS':
        return this.api.get(`/alerts/check/${message.data.identifier}`);
      case 'GET_AUTH_TOKEN':
        return this.api.getAuthToken();
      case 'SET_AUTH_TOKEN':
        return this.api.setAuthToken(message.data.accessToken, message.data.refreshToken);
      default:
        return { error: `Unknown message type: ${message.type}` };
    }
  }

  private async handleProductDetected(data: { asin?: string; url?: string; scraped?: any }) {
    const identifier = data.asin || data.url || '';
    const cacheKey = `product:${identifier}`;

    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const result = await this.api.get(`/products/lookup?identifier=${encodeURIComponent(identifier)}`);
    await this.cache.set(cacheKey, result, 15 * 60 * 1000); // 15 min cache
    return result;
  }

  private async handleLookup(data: { identifier: string; marketplace?: string }) {
    const cacheKey = `lookup:${data.identifier}:${data.marketplace || 'any'}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams({ identifier: data.identifier });
    if (data.marketplace) params.set('marketplace', data.marketplace);

    const result = await this.api.get(`/products/lookup?${params}`);
    await this.cache.set(cacheKey, result, 15 * 60 * 1000);
    return result;
  }
}
