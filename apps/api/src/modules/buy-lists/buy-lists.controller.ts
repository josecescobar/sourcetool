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
import { TeamMemberGuard } from '../../common/guards/team-member.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireRole } from '../../common/decorators/require-role.decorator';

@UseGuards(JwtAuthGuard, TeamMemberGuard)
@RequireRole('OWNER', 'ADMIN', 'VA', 'VIEWER')
@Controller('buy-lists')
export class BuyListsController {
  constructor(private buyListsService: BuyListsService) {}

  @Get()
  async getAll(@CurrentUser('teamId') teamId: string) {
    return { success: true, data: await this.buyListsService.getAll(teamId) };
  }

  @RequireRole('OWNER', 'ADMIN', 'VA')
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

  @RequireRole('OWNER', 'ADMIN', 'VA')
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

  @RequireRole('OWNER', 'ADMIN', 'VA')
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

  @RequireRole('OWNER', 'ADMIN', 'VA')
  @Post(':id/items/batch')
  async addItemsBatch(
    @Param('id') listId: string,
    @CurrentUser('teamId') teamId: string,
    @Body()
    body: {
      items: Array<{ productId: string; analysisId?: string; notes?: string }>;
    },
  ) {
    return {
      success: true,
      data: await this.buyListsService.addItemsBatch(
        listId,
        teamId,
        body.items,
      ),
    };
  }

  @RequireRole('OWNER', 'ADMIN', 'VA')
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

  @RequireRole('OWNER', 'ADMIN', 'VA')
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
