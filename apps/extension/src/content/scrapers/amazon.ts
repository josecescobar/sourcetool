export class AmazonScraper {
  static scrape() {
    const asin = this.extractAsin();
    if (!asin) return null;

    return {
      marketplace: this.detectMarketplace(),
      asin,
      title: this.getTitle(),
      price: this.getPrice(),
      buyBoxPrice: this.getBuyBoxPrice(),
      bsr: this.getBsr(),
      bsrCategory: this.getBsrCategory(),
      rating: this.getRating(),
      reviewCount: this.getReviewCount(),
      offerCount: this.getOfferCount(),
      imageUrl: this.getImageUrl(),
      brand: this.getBrand(),
      category: this.getCategory(),
      url: window.location.href,
    };
  }

  private static detectMarketplace(): string {
    const host = window.location.hostname;
    if (host.includes('amazon.ca')) return 'AMAZON_CA';
    if (host.includes('amazon.co.uk')) return 'AMAZON_UK';
    if (host.includes('amazon.de')) return 'AMAZON_DE';
    return 'AMAZON_US';
  }

  private static extractAsin(): string | null {
    // From URL
    const urlPatterns = [
      /\/dp\/([A-Z0-9]{10})/i,
      /\/gp\/product\/([A-Z0-9]{10})/i,
      /\/gp\/aw\/d\/([A-Z0-9]{10})/i,
    ];
    for (const pattern of urlPatterns) {
      const match = window.location.pathname.match(pattern);
      if (match?.[1]) return match[1].toUpperCase();
    }

    // From page elements
    const asinEl = document.getElementById('ASIN') as HTMLInputElement | null;
    if (asinEl?.value) return asinEl.value.toUpperCase();

    const detailBullets = document.getElementById('detailBullets_feature_div');
    if (detailBullets) {
      const text = detailBullets.textContent || '';
      const match = text.match(/ASIN\s*:\s*([A-Z0-9]{10})/i);
      if (match?.[1]) return match[1].toUpperCase();
    }

    return null;
  }

  private static getTitle(): string {
    return document.getElementById('productTitle')?.textContent?.trim() || '';
  }

  private static getPrice(): number | null {
    const priceEl = document.querySelector('.a-price .a-offscreen');
    if (priceEl) {
      const text = priceEl.textContent?.replace(/[^0-9.]/g, '') || '';
      const val = parseFloat(text);
      return isNaN(val) ? null : val;
    }
    return null;
  }

  private static getBuyBoxPrice(): number | null {
    const buyBoxEl = document.getElementById('price_inside_buybox') ||
      document.getElementById('newBuyBoxPrice') ||
      document.querySelector('#corePrice_feature_div .a-offscreen');
    if (buyBoxEl) {
      const text = buyBoxEl.textContent?.replace(/[^0-9.]/g, '') || '';
      const val = parseFloat(text);
      return isNaN(val) ? null : val;
    }
    return this.getPrice();
  }

  private static getBsr(): number | null {
    const detailsEl = document.getElementById('productDetails_detailBullets_sections1') ||
      document.getElementById('detailBullets_feature_div');
    if (detailsEl) {
      const text = detailsEl.textContent || '';
      const match = text.match(/#([\d,]+)\s+in\s/);
      if (match?.[1]) return parseInt(match[1].replace(/,/g, ''), 10);
    }
    return null;
  }

  private static getBsrCategory(): string | null {
    const detailsEl = document.getElementById('productDetails_detailBullets_sections1') ||
      document.getElementById('detailBullets_feature_div');
    if (detailsEl) {
      const text = detailsEl.textContent || '';
      const match = text.match(/#[\d,]+\s+in\s+([^()\n]+)/);
      if (match?.[1]) return match[1].trim();
    }
    return null;
  }

  private static getRating(): number | null {
    const ratingEl = document.querySelector('#acrPopover .a-icon-alt');
    if (ratingEl) {
      const match = ratingEl.textContent?.match(/([\d.]+)/);
      if (match?.[1]) return parseFloat(match[1]);
    }
    return null;
  }

  private static getReviewCount(): number | null {
    const reviewEl = document.getElementById('acrCustomerReviewText');
    if (reviewEl) {
      const match = reviewEl.textContent?.match(/([\d,]+)/);
      if (match?.[1]) return parseInt(match[1].replace(/,/g, ''), 10);
    }
    return null;
  }

  private static getOfferCount(): number | null {
    const offerEl = document.getElementById('olp-upd-new') ||
      document.querySelector('[data-action="show-all-offers-display"]');
    if (offerEl) {
      const match = offerEl.textContent?.match(/\((\d+)\)/);
      if (match?.[1]) return parseInt(match[1], 10);
    }
    return null;
  }

  private static getImageUrl(): string | null {
    const imgEl = document.getElementById('landingImage') as HTMLImageElement | null;
    return imgEl?.src || null;
  }

  private static getBrand(): string | null {
    const brandEl = document.getElementById('bylineInfo');
    if (brandEl) {
      const text = brandEl.textContent?.replace(/^(Visit the |Brand: )/, '').replace(/ Store$/, '').trim();
      return text || null;
    }
    return null;
  }

  private static getCategory(): string | null {
    const breadcrumbs = document.querySelectorAll('#wayfinding-breadcrumbs_feature_div .a-link-normal');
    if (breadcrumbs.length > 0) {
      return breadcrumbs[breadcrumbs.length - 1].textContent?.trim() || null;
    }
    return null;
  }
}
