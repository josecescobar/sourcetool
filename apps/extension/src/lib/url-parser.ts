export type DetectedMarketplace = 'amazon' | 'walmart' | 'ebay' | null;

export function detectMarketplaceFromUrl(url: string): DetectedMarketplace {
  try {
    const hostname = new URL(url).hostname;
    if (hostname.includes('amazon.')) return 'amazon';
    if (hostname.includes('walmart.')) return 'walmart';
    if (hostname.includes('ebay.')) return 'ebay';
  } catch {}
  return null;
}

export function extractProductId(url: string): { marketplace: DetectedMarketplace; id: string | null } {
  const marketplace = detectMarketplaceFromUrl(url);
  const pathname = new URL(url).pathname;

  switch (marketplace) {
    case 'amazon': {
      const match = pathname.match(/\/dp\/([A-Z0-9]{10})/i) || pathname.match(/\/gp\/product\/([A-Z0-9]{10})/i);
      return { marketplace, id: match?.[1]?.toUpperCase() || null };
    }
    case 'walmart': {
      const match = pathname.match(/\/ip\/[^/]+\/(\d+)/);
      return { marketplace, id: match?.[1] || null };
    }
    case 'ebay': {
      const match = pathname.match(/\/itm\/[^/]*\/(\d+)/);
      return { marketplace, id: match?.[1] || null };
    }
    default:
      return { marketplace: null, id: null };
  }
}
