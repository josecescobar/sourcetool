import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { TeamMemberGuard } from '../../common/guards/team-member.guard';
import { PlanLimitGuard } from '../../common/guards/plan-limit.guard';
import { RequireRole } from '../../common/decorators/require-role.decorator';
import { PlanAction } from '../../common/decorators/plan-action.decorator';

@UseGuards(JwtAuthGuard, TeamMemberGuard, PlanLimitGuard)
@RequireRole('OWNER', 'ADMIN')
@Controller('export')
export class ExportController {
  constructor(private exportService: ExportService) {}

  @Post('csv')
  async csv(@Body() body: { analysisIds: string[] }): Promise<any> {
    return { success: true, data: await this.exportService.exportCsv(body.analysisIds) };
  }

  @PlanAction('export')
  @Post('google-sheets')
  async googleSheets(@Body() body: { analysisIds: string[] }) {
    return { success: true, data: await this.exportService.exportGoogleSheets(body.analysisIds) };
  }
}
