export class EbayScraper {
  static scrape() {
    return {
      marketplace: window.location.hostname.includes('ebay.co.uk') ? 'EBAY_UK' : 'EBAY_US',
      ebayItemId: this.getItemId(),
      title: this.getTitle(),
      price: this.getPrice(),
      condition: this.getCondition(),
      sellerName: this.getSellerName(),
      sellerFeedback: this.getSellerFeedback(),
      imageUrl: this.getImageUrl(),
      url: window.location.href,
    };
  }

  private static getItemId(): string | null {
    const match = window.location.pathname.match(/\/itm\/[^/]*\/(\d+)/);
    return match?.[1] || null;
  }

  private static getTitle(): string {
    const el = document.querySelector('h1.x-item-title__mainTitle span') || document.querySelector('h1');
    return el?.textContent?.trim() || '';
  }

  private static getPrice(): number | null {
    const el = document.querySelector('.x-price-primary span') || document.querySelector('[itemprop="price"]');
    if (el) {
      const text = el.textContent?.replace(/[^0-9.]/g, '') || '';
      const val = parseFloat(text);
      return isNaN(val) ? null : val;
    }
    return null;
  }

  private static getCondition(): string | null {
    const el = document.querySelector('.x-item-condition-value span');
    return el?.textContent?.trim() || null;
  }

  private static getSellerName(): string | null {
    const el = document.querySelector('.x-sellercard-atf__info__about-seller a span');
    return el?.textContent?.trim() || null;
  }

  private static getSellerFeedback(): number | null {
    const el = document.querySelector('.x-sellercard-atf__info__about-seller');
    if (el) {
      const match = el.textContent?.match(/([\d.]+)%/);
      if (match?.[1]) return parseFloat(match[1]);
    }
    return null;
  }

  private static getImageUrl(): string | null {
    const el = document.querySelector('.ux-image-carousel-item img') as HTMLImageElement | null;
    return el?.src || null;
  }
}
