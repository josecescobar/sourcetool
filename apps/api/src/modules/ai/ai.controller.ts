import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { TeamMemberGuard } from '../../common/guards/team-member.guard';
import { PlanLimitGuard } from '../../common/guards/plan-limit.guard';
import { RequireRole } from '../../common/decorators/require-role.decorator';
import { PlanAction } from '../../common/decorators/plan-action.decorator';
import type { DealScoreInput } from '@sourcetool/shared';

@UseGuards(JwtAuthGuard, TeamMemberGuard, PlanLimitGuard)
@RequireRole('OWNER', 'ADMIN', 'VA')
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @PlanAction('ai_verdict')
  @Post('deal-score')
  async dealScore(@Body() input: DealScoreInput) {
    return { success: true, data: await this.aiService.getDealScore(input) };
  }

  @PlanAction('ai_verdict')
  @Post('sell-through')
  async sellThrough(@Body() input: {
    title: string; category?: string; bsr?: number; sellPrice: number;
    offerCount?: number; fbaOfferCount?: number; isAmazonSelling?: boolean; avgBsr30d?: number;
  }) {
    return { success: true, data: await this.aiService.getSellThrough(input) };
  }
}
