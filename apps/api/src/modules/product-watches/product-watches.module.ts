import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ProductWatchesService } from './product-watches.service';
import { ProductWatchesController } from './product-watches.controller';
import { WatchCheckerService } from './watch-checker.service';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [ScheduleModule.forRoot(), IntegrationsModule],
  controllers: [ProductWatchesController],
  providers: [ProductWatchesService, WatchCheckerService],
  exports: [ProductWatchesService],
})
export class ProductWatchesModule {}
