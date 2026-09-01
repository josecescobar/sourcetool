import { Controller, Post, Get, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { BulkScanService } from './bulk-scan.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { TeamMemberGuard } from '../../common/guards/team-member.guard';
import { PlanLimitGuard } from '../../common/guards/plan-limit.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireRole } from '../../common/decorators/require-role.decorator';
import { PlanAction } from '../../common/decorators/plan-action.decorator';

@UseGuards(JwtAuthGuard, TeamMemberGuard, PlanLimitGuard)
@RequireRole('OWNER', 'ADMIN', 'VA', 'VIEWER')
@Controller('bulk-scans')
export class BulkScanController {
  constructor(private bulkScanService: BulkScanService) {}

  @PlanAction('bulk_scan')
  @RequireRole('OWNER', 'ADMIN', 'VA')
  @Post()
  async create(
    @Body() body: {
      fileName: string;
      marketplace: string;
      fulfillmentType: string;
      defaultBuyPrice?: number;
      rows: Array<{ identifier: string; buyPrice?: number }>;
    },
    @CurrentUser('id') userId: string,
    @CurrentUser('teamId') teamId: string,
  ): Promise<any> {
    return { success: true, data: await this.bulkScanService.create(teamId, userId, body) };
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<any> {
    return { success: true, data: await this.bulkScanService.getById(id) };
  }

  @Get(':id/results')
  async getResults(@Param('id') id: string, @Query('sort') sort?: string, @Query('filter') filter?: string): Promise<any> {
    return { success: true, data: await this.bulkScanService.getResults(id, sort, filter) };
  }

  @RequireRole('OWNER', 'ADMIN', 'VA')
  @Post(':id/retry')
  async retry(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('teamId') teamId: string,
  ): Promise<any> {
    return { success: true, data: await this.bulkScanService.retryFailed(id, teamId, userId) };
  }

  @RequireRole('OWNER', 'ADMIN', 'VA')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.bulkScanService.delete(id);
    return { success: true };
  }
}
