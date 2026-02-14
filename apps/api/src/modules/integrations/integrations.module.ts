import { Module } from '@nestjs/common';
import { RainforestService } from './rainforest/rainforest.service';

@Module({
  providers: [RainforestService],
  exports: [RainforestService],
})
export class IntegrationsModule {}
