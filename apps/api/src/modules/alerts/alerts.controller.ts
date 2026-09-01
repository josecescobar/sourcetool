import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Get()
  async getRecent(
    @CurrentUser('teamId') teamId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<any> {
    return {
      success: true,
      data: await this.alertsService.getRecentForTeam(
        teamId,
        page ? parseInt(page, 10) : undefined,
        limit ? parseInt(limit, 10) : undefined,
      ),
    };
  }

  @Get('check/:identifier')
  async check(@Param('identifier') identifier: string): Promise<any> {
    return { success: true, data: await this.alertsService.checkByIdentifier(identifier) };
  }

  @Post('check-batch')
  async checkBatch(@Body() body: { identifiers: string[] }): Promise<any> {
    return { success: true, data: await this.alertsService.checkBatch(body.identifiers) };
  }

  @Get('product/:productId')
  async getByProduct(@Param('productId') productId: string): Promise<any> {
    return { success: true, data: await this.alertsService.getByProductId(productId) };
  }
}
