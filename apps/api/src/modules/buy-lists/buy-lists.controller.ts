import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { BuyListsService } from './buy-lists.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('buy-lists')
export class BuyListsController {
  constructor(private buyListsService: BuyListsService) {}

  @Get()
  async getAll(@CurrentUser('teamId') teamId: string) {
    return { success: true, data: await this.buyListsService.getAll(teamId) };
  }

  @Post()
  async create(
    @CurrentUser('teamId') teamId: string,
    @Body() body: { name: string },
  ) {
    return {
      success: true,
      data: await this.buyListsService.create(teamId, body.name),
    };
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
    @CurrentUser('teamId') teamId: string,
  ) {
    return {
      success: true,
      data: await this.buyListsService.getById(id, teamId),
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('teamId') teamId: string,
    @Body() body: { name: string },
  ) {
    return {
      success: true,
      data: await this.buyListsService.update(id, teamId, body.name),
    };
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser('teamId') teamId: string,
  ) {
    return {
      success: true,
      data: await this.buyListsService.delete(id, teamId),
    };
  }

  @Post(':id/items')
  async addItem(
    @Param('id') listId: string,
    @CurrentUser('teamId') teamId: string,
    @Body() body: { productId: string; analysisId?: string; notes?: string },
  ) {
    return {
      success: true,
      data: await this.buyListsService.addItem(listId, teamId, body),
    };
  }

  @Delete(':id/items/:itemId')
  async removeItem(
    @Param('id') listId: string,
    @Param('itemId') itemId: string,
    @CurrentUser('teamId') teamId: string,
  ) {
    return {
      success: true,
      data: await this.buyListsService.removeItem(listId, itemId, teamId),
    };
  }
}
