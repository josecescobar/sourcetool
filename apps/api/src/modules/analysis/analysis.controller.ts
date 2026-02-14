import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CalculateInput, BreakevenInput } from '@sourcetool/shared';

@UseGuards(JwtAuthGuard)
@Controller('analysis')
export class AnalysisController {
  constructor(private analysisService: AnalysisService) {}

  @Post('calculate')
  async calculate(
    @Body() input: CalculateInput,
    @CurrentUser('id') userId: string,
    @CurrentUser('teamId') teamId: string,
  ): Promise<any> {
    return { success: true, data: await this.analysisService.calculate(input, userId, teamId) };
  }

  @Post('breakeven')
  async breakeven(@Body() input: BreakevenInput) {
    return { success: true, data: this.analysisService.calculateBreakeven(input) };
  }

  @Post('scenario')
  async scenario(@Body() input: CalculateInput) {
    return { success: true, data: this.analysisService.scenario(input) };
  }

  @Get('history')
  async history(
    @Query('teamId') teamId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<any> {
    return { success: true, ...await this.analysisService.getHistory(teamId, Number(page) || 1, Number(limit) || 20) };
  }
}
