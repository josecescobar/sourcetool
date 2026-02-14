import { Module } from '@nestjs/common';
import { BulkScanController } from './bulk-scan.controller';
import { BulkScanService } from './bulk-scan.service';

@Module({
  controllers: [BulkScanController],
  providers: [BulkScanService],
})
export class BulkScanModule {}
