import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('invites')
export class TeamInvitesController {
  constructor(private teamsService: TeamsService) {}

  @Get(':token')
  async getInviteInfo(@Param('token') token: string): Promise<any> {
    return { success: true, data: await this.teamsService.getInviteInfo(token) };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':token/accept')
  async acceptInvite(
    @Param('token') token: string,
    @CurrentUser('id') userId: string,
  ): Promise<any> {
    return { success: true, data: await this.teamsService.acceptInvite(token, userId) };
  }
}
