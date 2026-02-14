import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import type { Marketplace } from '@sourcetool/shared';

@UseGuards(JwtAuthGuard)
@Controller('history')
export class HistoryController {
  constructor(private historyService: HistoryService) {}

  @Get('price/:productId')
  async priceHistory(
    @Param('productId') productId: string,
    @Query('marketplace') marketplace?: Marketplace,
    @Query('days') days?: string,
  ): Promise<any> {
    return { success: true, data: await this.historyService.getPriceHistory(productId, marketplace, Number(days) || 90) };
  }

  @Get('bsr/:productId')
  async bsrHistory(
    @Param('productId') productId: string,
    @Query('marketplace') marketplace?: Marketplace,
    @Query('days') days?: string,
  ): Promise<any> {
    return { success: true, data: await this.historyService.getBsrHistory(productId, marketplace, Number(days) || 90) };
  }

  @Get('offers/:productId')
  async offerHistory(
    @Param('productId') productId: string,
    @Query('marketplace') marketplace?: Marketplace,
    @Query('days') days?: string,
  ): Promise<any> {
    return { success: true, data: await this.historyService.getOfferHistory(productId, marketplace, Number(days) || 90) };
  }
}
