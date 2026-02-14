import { Module } from '@nestjs/common';
import { BulkScanController } from './bulk-scan.controller';
import { BulkScanService } from './bulk-scan.service';
import { ProductsModule } from '../products/products.module';
import { AnalysisModule } from '../analysis/analysis.module';

@Module({
  imports: [ProductsModule, AnalysisModule],
  controllers: [BulkScanController],
  providers: [BulkScanService],
})
export class BulkScanModule {}
