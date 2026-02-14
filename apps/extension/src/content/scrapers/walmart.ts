export class WalmartScraper {
  static scrape() {
    return {
      marketplace: 'WALMART_US',
      walmartId: this.getProductId(),
      title: this.getTitle(),
      price: this.getPrice(),
      rating: this.getRating(),
      reviewCount: this.getReviewCount(),
      imageUrl: this.getImageUrl(),
      brand: this.getBrand(),
      url: window.location.href,
    };
  }

  private static getProductId(): string | null {
    const match = window.location.pathname.match(/\/ip\/[^/]+\/(\d+)/);
    return match?.[1] || null;
  }

  private static getTitle(): string {
    const el = document.querySelector('h1[itemprop="name"]') || document.querySelector('h1');
    return el?.textContent?.trim() || '';
  }

  private static getPrice(): number | null {
    const el = document.querySelector('[itemprop="price"]') ||
      document.querySelector('[data-automation-id="product-price"] .f2');
    if (el) {
      const text = el.textContent?.replace(/[^0-9.]/g, '') || '';
      const val = parseFloat(text);
      return isNaN(val) ? null : val;
    }
    return null;
  }

  private static getRating(): number | null {
    const el = document.querySelector('[itemprop="ratingValue"]');
    if (el) return parseFloat(el.getAttribute('content') || '') || null;
    return null;
  }

  private static getReviewCount(): number | null {
    const el = document.querySelector('[itemprop="reviewCount"]');
    if (el) return parseInt(el.getAttribute('content') || '', 10) || null;
    return null;
  }

  private static getImageUrl(): string | null {
    const el = document.querySelector('[data-testid="hero-image"] img') as HTMLImageElement | null;
    return el?.src || null;
  }

  private static getBrand(): string | null {
    const el = document.querySelector('[itemprop="brand"]') || document.querySelector('[data-automation-id="product-brand"]');
    return el?.textContent?.trim() || null;
  }
}
