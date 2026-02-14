import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { resolve } from 'path';
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
import { EmailModule } from './modules/email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(__dirname, '..', '..', '..', '.env'),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    EmailModule,
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
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
