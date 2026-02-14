import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { ProfitCalculatorEngine } from './engines/profit-calculator.engine';

@Module({
  controllers: [AnalysisController],
  providers: [AnalysisService, ProfitCalculatorEngine],
  exports: [AnalysisService, ProfitCalculatorEngine],
})
export class AnalysisModule {}
