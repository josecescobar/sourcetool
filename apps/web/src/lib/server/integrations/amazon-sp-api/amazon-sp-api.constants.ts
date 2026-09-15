import type { Marketplace } from '@sourcetool/shared';

export const SP_API_MARKETPLACE_IDS: Partial<Record<Marketplace, string>> = {
  AMAZON_US: 'ATVPDKIKX0DER',
  AMAZON_CA: 'A2EUQ1WTGCTBG2',
  AMAZON_UK: 'A1F83G8C2ARO7P',
  AMAZON_DE: 'A1PA6795UKMFR9',
};

export const SP_API_REGIONAL_ENDPOINTS: Partial<Record<Marketplace, string>> = {
  AMAZON_US: 'sellingpartnerapi-na.amazon.com',
  AMAZON_CA: 'sellingpartnerapi-na.amazon.com',
  AMAZON_UK: 'sellingpartnerapi-eu.amazon.com',
  AMAZON_DE: 'sellingpartnerapi-eu.amazon.com',
};

export const SP_API_SANDBOX_ENDPOINTS: Partial<Record<Marketplace, string>> = {
  AMAZON_US: 'sandbox.sellingpartnerapi-na.amazon.com',
  AMAZON_CA: 'sandbox.sellingpartnerapi-na.amazon.com',
  AMAZON_UK: 'sandbox.sellingpartnerapi-eu.amazon.com',
  AMAZON_DE: 'sandbox.sellingpartnerapi-eu.amazon.com',
};

export const SP_API_CURRENCY: Partial<Record<Marketplace, string>> = {
  AMAZON_US: 'USD',
  AMAZON_CA: 'CAD',
  AMAZON_UK: 'GBP',
  AMAZON_DE: 'EUR',
};

export const LWA_TOKEN_URL = 'https://api.amazon.com/auth/o2/token';

export const DEFAULT_MARKETPLACE: Marketplace = 'AMAZON_US';
