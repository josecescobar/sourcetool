import type { Marketplace } from '@sourcetool/shared';

export const MARKETPLACE_AMAZON_DOMAIN: Record<string, string> = {
  AMAZON_US: 'amazon.com',
  AMAZON_CA: 'amazon.ca',
  AMAZON_UK: 'amazon.co.uk',
  AMAZON_DE: 'amazon.de',
};

export const DEFAULT_MARKETPLACE: Marketplace = 'AMAZON_US';

export const RAINFOREST_BASE_URL = 'https://api.rainforestapi.com/request';

/** Listings older than this are considered stale and refreshed in the background */
export const STALENESS_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
