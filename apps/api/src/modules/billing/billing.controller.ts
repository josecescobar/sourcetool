import { Controller, Post, Get, Body, Req, UseGuards, RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { PlanTier } from '@sourcetool/shared';

@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async checkout(@Body() body: { planTier: PlanTier }, @CurrentUser('teamId') teamId: string) {
    return { success: true, data: await this.billingService.createCheckoutSession(teamId, body.planTier) };
  }

  @UseGuards(JwtAuthGuard)
  @Post('portal')
  async portal(@CurrentUser('teamId') teamId: string) {
    return { success: true, data: await this.billingService.createPortalSession(teamId) };
  }

  @Post('webhook')
  async webhook(@Req() req: RawBodyRequest<Request>) {
    const signature = req.headers['stripe-signature'] as string;
    await this.billingService.handleWebhook(req.rawBody!, signature);
    return { received: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription')
  async subscription(@CurrentUser('teamId') teamId: string) {
    return { success: true, data: await this.billingService.getSubscription(teamId) };
  }
}
