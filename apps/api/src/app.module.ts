import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { BulkScanModule } from './modules/bulk-scan/bulk-scan.module';
import { AiModule } from './modules/ai/ai.module';
import { HistoryModule } from './modules/history/history.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { TeamsModule } from './modules/teams/teams.module';
import { ExportModule } from './modules/export/export.module';
import { BillingModule } from './modules/billing/billing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,
    ProductsModule,
    AnalysisModule,
    BulkScanModule,
    AiModule,
    HistoryModule,
    AlertsModule,
    TeamsModule,
    ExportModule,
    BillingModule,
  ],
})
export class AppModule {}
