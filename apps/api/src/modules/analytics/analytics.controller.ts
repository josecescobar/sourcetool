import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { TeamMemberGuard } from '../../common/guards/team-member.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireRole } from '../../common/decorators/require-role.decorator';

@UseGuards(JwtAuthGuard, TeamMemberGuard)
@RequireRole('OWNER', 'ADMIN')
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('summary')
  async summary(
    @CurrentUser('teamId') teamId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return {
      success: true,
      data: await this.analyticsService.getSummary(teamId, startDate, endDate),
    };
  }

  @Get('profit-over-time')
  async profitOverTime(
    @CurrentUser('teamId') teamId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return {
      success: true,
      data: await this.analyticsService.getProfitOverTime(
        teamId,
        startDate,
        endDate,
      ),
    };
  }

  @Get('marketplace-breakdown')
  async marketplaceBreakdown(
    @CurrentUser('teamId') teamId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return {
      success: true,
      data: await this.analyticsService.getMarketplaceBreakdown(
        teamId,
        startDate,
        endDate,
      ),
    };
  }

  @Get('top-products')
  async topProducts(
    @CurrentUser('teamId') teamId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    return {
      success: true,
      data: await this.analyticsService.getTopProducts(
        teamId,
        startDate,
        endDate,
        Number(limit) || 10,
      ),
    };
  }

  @Get('recent')
  async recent(
    @CurrentUser('teamId') teamId: string,
    @Query('limit') limit?: string,
  ) {
    return {
      success: true,
      data: await this.analyticsService.getRecentAnalyses(
        teamId,
        Number(limit) || 10,
      ),
    };
  }
}
