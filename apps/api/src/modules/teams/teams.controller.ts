import { Controller, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { TeamRole } from '@sourcetool/shared';

@UseGuards(JwtAuthGuard)
@Controller('teams')
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Post()
  async create(@Body() body: { name: string }, @CurrentUser('id') userId: string): Promise<any> {
    return { success: true, data: await this.teamsService.create(body.name, userId) };
  }

  @Post(':id/invite')
  async invite(@Param('id') teamId: string, @Body() body: { email: string; role: TeamRole }): Promise<any> {
    return { success: true, data: await this.teamsService.invite(teamId, body.email, body.role) };
  }

  @Patch(':id/members/:memberId')
  async updateRole(@Param('id') teamId: string, @Param('memberId') memberId: string, @Body() body: { role: TeamRole }): Promise<any> {
    return { success: true, data: await this.teamsService.updateMemberRole(teamId, memberId, body.role) };
  }

  @Delete(':id/members/:memberId')
  async removeMember(@Param('id') teamId: string, @Param('memberId') memberId: string) {
    await this.teamsService.removeMember(teamId, memberId);
    return { success: true };
  }
}
