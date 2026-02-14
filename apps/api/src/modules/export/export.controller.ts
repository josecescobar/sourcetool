import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';

@UseGuards(JwtAuthGuard)
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
