import { Module } from '@nestjs/common';
import { BuyListsController } from './buy-lists.controller';
import { BuyListsService } from './buy-lists.service';

@Module({
  controllers: [BuyListsController],
  providers: [BuyListsService],
  exports: [BuyListsService],
})
export class BuyListsModule {}
