import { Injectable } from '@nestjs/common';
import { scoreDeal, predictSellThrough, extractProductFromImage } from '@sourcetool/ai';
import type {
  DealScoreInput,
  DealScoreOutput,
  SellThroughPrediction,
  ExtractionResult,
  ImageExtractionInput,
} from '@sourcetool/shared';

@Injectable()
export class AiService {
  async getDealScore(input: DealScoreInput): Promise<DealScoreOutput> {
    return scoreDeal(input);
  }

  async extractImage(input: ImageExtractionInput): Promise<ExtractionResult | null> {
    return extractProductFromImage(input);
  }

  async getSellThrough(input: {
    title: string; category?: string; bsr?: number; sellPrice: number;
    offerCount?: number; fbaOfferCount?: number; isAmazonSelling?: boolean; avgBsr30d?: number;
  }): Promise<SellThroughPrediction> {
    return predictSellThrough(input);
  }
}
