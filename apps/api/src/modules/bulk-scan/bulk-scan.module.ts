import { Module } from '@nestjs/common';
import { BulkScanController } from './bulk-scan.controller';
import { BulkScanService } from './bulk-scan.service';
import { ProductsModule } from '../products/products.module';
import { AnalysisModule } from '../analysis/analysis.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [ProductsModule, AnalysisModule, AiModule],
  controllers: [BulkScanController],
  providers: [BulkScanService],
})
export class BulkScanModule {}
