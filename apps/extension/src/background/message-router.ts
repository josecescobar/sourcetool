import type { ApiClient } from './api-client';
import { CacheManager } from './cache';

export type MessageType =
  | 'PRODUCT_DETECTED'
  | 'LOOKUP_PRODUCT'
  | 'CALCULATE_PROFIT'
  | 'GET_DEAL_SCORE'
  | 'GET_HISTORY'
  | 'GET_BSR_HISTORY'
  | 'CHECK_ALERTS'
  | 'GET_AUTH_TOKEN'
  | 'SET_AUTH_TOKEN'
  | 'ANALYZE_SELECTION'
  | 'LOGIN'
  | 'LOGOUT'
  | 'CHECK_AUTH'
  | 'GET_CURRENT_PRODUCT'
  | 'GET_BUY_LISTS'
  | 'ADD_TO_BUY_LIST'
  | 'GET_WATCHES'
  | 'CREATE_WATCH'
  | 'DELETE_WATCH'
  | 'GET_ALERTS'
  | 'GET_UNREAD_COUNT'
  | 'MARK_ALERT_READ';

export interface ExtensionMessage {
  type: MessageType;
  data?: any;
}

export class MessageRouter {
  private cache = new CacheManager();
  private currentProduct: any = null;

  constructor(private api: ApiClient) {
    this.restoreCurrentProduct();
  }

  private async restoreCurrentProduct() {
    try {
      const result = await chrome.storage.session.get(['currentProduct']);
      if (result.currentProduct) {
        this.currentProduct = result.currentProduct;
      }
    } catch {
      // storage.session may not be available in all contexts
    }
  }

  private async persistCurrentProduct(product: any) {
    this.currentProduct = product;
    try {
      await chrome.storage.session.set({ currentProduct: product });
    } catch {
      // fallback silently
    }
  }

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
      case 'GET_BSR_HISTORY':
        return this.api.get(`/history/bsr/${message.data.productId}?days=${message.data.days || 90}`);
      case 'CHECK_ALERTS':
        return this.api.get(`/alerts/check/${message.data.identifier}`);
      case 'GET_AUTH_TOKEN':
        return this.api.getAuthToken();
      case 'SET_AUTH_TOKEN':
        return this.api.setAuthToken(message.data.accessToken, message.data.refreshToken);
      case 'LOGIN':
        return this.api.login(message.data.email, message.data.password);
      case 'LOGOUT':
        return this.api.clearTokens();
      case 'CHECK_AUTH': {
        const tokenInfo = await this.api.getAuthToken();
        return { authenticated: !!tokenInfo.accessToken };
      }
      case 'GET_CURRENT_PRODUCT':
        return this.currentProduct;
      case 'GET_BUY_LISTS':
        return this.api.get('/buy-lists');
      case 'ADD_TO_BUY_LIST':
        return this.api.post(`/buy-lists/${message.data.listId}/items`, {
          productId: message.data.productId,
          analysisId: message.data.analysisId,
        });
      case 'GET_WATCHES':
        return this.api.get('/product-watches');
      case 'CREATE_WATCH':
        return this.api.post('/product-watches', message.data);
      case 'DELETE_WATCH':
        return this.api.delete(`/product-watches/${message.data.id}`);
      case 'GET_ALERTS':
        return this.api.get('/product-watches/alerts');
      case 'GET_UNREAD_COUNT':
        return this.api.get('/product-watches/alerts/count');
      case 'MARK_ALERT_READ':
        return this.api.post(`/product-watches/alerts/${message.data.id}/read`);
      case 'ANALYZE_SELECTION':
        return null;
      default:
        return { error: `Unknown message type: ${(message as any).type}` };
    }
  }

  private async handleProductDetected(data: { asin?: string; url?: string; marketplace?: string; [key: string]: any }) {
    const identifier = data.asin || data.url || '';
    const cacheKey = `product:${identifier}`;

    const cached = await this.cache.get(cacheKey);
    const result = cached || await this.api.get(`/products/lookup?identifier=${encodeURIComponent(identifier)}`);

    if (!cached && result?.success) {
      await this.cache.set(cacheKey, result, 15 * 60 * 1000);
    }

    if (result?.data) {
      const product = {
        ...result.data,
        // Merge scraped data for fields the API might not have
        marketplace: data.marketplace || result.data.listings?.[0]?.marketplace,
        price: result.data.listings?.[0]?.currentPrice ?? data.price,
        bsr: result.data.listings?.[0]?.bsr ?? data.bsr,
        bsrCategory: result.data.listings?.[0]?.bsrCategory ?? data.bsrCategory,
        rating: result.data.listings?.[0]?.rating ?? data.rating,
        reviewCount: result.data.listings?.[0]?.reviewCount ?? data.reviewCount,
      };
      await this.persistCurrentProduct(product);
      // Broadcast to all extension pages (side panel, popup)
      chrome.runtime.sendMessage({ type: 'PRODUCT_DATA', data: product }).catch(() => {});
    }

    return result;
  }

  private async handleLookup(data: { identifier: string; marketplace?: string }) {
    const cacheKey = `lookup:${data.identifier}:${data.marketplace || 'any'}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams({ identifier: data.identifier });
    if (data.marketplace) params.set('marketplace', data.marketplace);

    const result = await this.api.get(`/products/lookup?${params}`);
    if (result?.success) {
      await this.cache.set(cacheKey, result, 15 * 60 * 1000);
    }
    return result;
  }
}
