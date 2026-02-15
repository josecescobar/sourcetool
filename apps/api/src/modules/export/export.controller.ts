import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { TeamMemberGuard } from '../../common/guards/team-member.guard';
import { RequireRole } from '../../common/decorators/require-role.decorator';

@UseGuards(JwtAuthGuard, TeamMemberGuard)
@RequireRole('OWNER', 'ADMIN')
@Controller('export')
export class ExportController {
  constructor(private exportService: ExportService) {}

  @Post('csv')
  async csv(@Body() body: { analysisIds: string[] }): Promise<any> {
    return { success: true, data: await this.exportService.exportCsv(body.analysisIds) };
  }

  @Post('google-sheets')
  async googleSheets(@Body() body: { analysisIds: string[] }) {
    return { success: true, data: await this.exportService.exportGoogleSheets(body.analysisIds) };
  }
}
