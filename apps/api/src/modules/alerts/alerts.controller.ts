import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Get('check/:identifier')
  async check(@Param('identifier') identifier: string) {
    return { success: true, data: await this.alertsService.checkByIdentifier(identifier) };
  }

  @Post('check-batch')
  async checkBatch(@Body() body: { identifiers: string[] }) {
    return { success: true, data: await this.alertsService.checkBatch(body.identifiers) };
  }

  @Get('product/:productId')
  async getByProduct(@Param('productId') productId: string) {
    return { success: true, data: await this.alertsService.getByProductId(productId) };
  }
}
