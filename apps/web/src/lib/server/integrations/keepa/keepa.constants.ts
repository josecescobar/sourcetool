import type { Marketplace } from '@sourcetool/shared';

export const KEEPA_BASE_URL = 'https://api.keepa.com/product';

export const KEEPA_DOMAIN_IDS: Partial<Record<Marketplace, number>> = {
  AMAZON_US: 1,
  AMAZON_UK: 2,
  AMAZON_DE: 3,
  AMAZON_CA: 6,
};

export const DEFAULT_MARKETPLACE: Marketplace = 'AMAZON_US';
