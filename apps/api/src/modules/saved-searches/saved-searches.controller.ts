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
import { TeamMemberGuard } from '../../common/guards/team-member.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireRole } from '../../common/decorators/require-role.decorator';
import { SavedSearchesService } from './saved-searches.service';

@UseGuards(JwtAuthGuard, TeamMemberGuard)
@RequireRole('OWNER', 'ADMIN', 'VA', 'VIEWER')
@Controller('saved-searches')
export class SavedSearchesController {
  constructor(private readonly savedSearches: SavedSearchesService) {}

  @Get()
  async getAll(@CurrentUser('teamId') teamId: string) {
    return { success: true, data: await this.savedSearches.getAll(teamId) };
  }

  @RequireRole('OWNER', 'ADMIN', 'VA')
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

  @RequireRole('OWNER', 'ADMIN', 'VA')
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser('teamId') teamId: string,
  ) {
    return { success: true, data: await this.savedSearches.remove(id, teamId) };
  }
}
