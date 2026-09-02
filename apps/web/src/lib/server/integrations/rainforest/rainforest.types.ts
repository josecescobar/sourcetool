export interface RainforestResponse {
  request_info: {
    success: boolean;
    credits_used: number;
    credits_remaining: number;
  };
  product?: RainforestProduct;
}

export interface RainforestProduct {
  asin?: string;
  parent_asin?: string;
  title?: string;
  brand?: string;
  link?: string;
  rating?: number;
  ratings_total?: number;
  main_image?: { link?: string };
  images?: Array<{ link?: string }>;
  dimensions?: string;
  weight?: string;
  specifications?: Array<{ name?: string; value?: string }>;
  bestsellers_rank?: Array<{
    category?: string;
    rank?: number;
  }>;
  buybox_winner?: RainforestBuyboxWinner;
  price?: {
    symbol?: string;
    value?: number;
    currency?: string;
    raw?: string;
  };
  categories?: Array<{ name?: string }>;
  feature_bullets?: string[];
}

export interface RainforestBuyboxWinner {
  price?: {
    symbol?: string;
    value?: number;
    currency?: string;
    raw?: string;
  };
  fulfillment?: {
    type?: string;
    is_sold_by_amazon?: boolean;
    is_fulfilled_by_amazon?: boolean;
  };
  is_prime?: boolean;
  condition?: { is_new?: boolean };
  availability?: { type?: string; raw?: string };
  offer_id?: string;
}
