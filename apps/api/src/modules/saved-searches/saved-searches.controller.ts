import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SavedSearchesService } from './saved-searches.service';

@UseGuards(JwtAuthGuard)
@Controller('saved-searches')
export class SavedSearchesController {
  constructor(private readonly savedSearches: SavedSearchesService) {}

  @Get()
  async getAll(@CurrentUser('teamId') teamId: string) {
    return { success: true, data: await this.savedSearches.getAll(teamId) };
  }

  @Post()
  async create(
    @CurrentUser('teamId') teamId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { query: string; marketplace?: string; filters?: any },
  ) {
    return {
      success: true,
      data: await this.savedSearches.create(teamId, userId, body),
    };
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser('teamId') teamId: string,
  ) {
    return { success: true, data: await this.savedSearches.remove(id, teamId) };
  }
}
