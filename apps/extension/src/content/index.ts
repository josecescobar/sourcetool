import { AmazonScraper } from './scrapers/amazon';
import { WalmartScraper } from './scrapers/walmart';
import { EbayScraper } from './scrapers/ebay';

function detectMarketplace(): string | null {
  const host = window.location.hostname;
  if (host.includes('amazon.')) return 'amazon';
  if (host.includes('walmart.')) return 'walmart';
  if (host.includes('ebay.')) return 'ebay';
  return null;
}

function init() {
  const marketplace = detectMarketplace();
  if (!marketplace) return;

  let scraped: any = null;

  switch (marketplace) {
    case 'amazon':
      scraped = AmazonScraper.scrape();
      break;
    case 'walmart':
      scraped = WalmartScraper.scrape();
      break;
    case 'ebay':
      scraped = EbayScraper.scrape();
      break;
  }

  if (scraped) {
    chrome.runtime.sendMessage({
      type: 'PRODUCT_DETECTED',
      data: scraped,
    });
  }
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ANALYZE_SELECTION') {
    chrome.runtime.sendMessage({
      type: 'LOOKUP_PRODUCT',
      data: { identifier: message.data },
    });
  }
});

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
