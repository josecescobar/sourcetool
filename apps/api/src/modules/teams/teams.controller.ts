import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { TeamMemberGuard } from '../../common/guards/team-member.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireRole } from '../../common/decorators/require-role.decorator';
import type { TeamRole } from '@sourcetool/shared';

@UseGuards(JwtAuthGuard, TeamMemberGuard)
@Controller('teams')
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Post()
  async create(@Body() body: { name: string }, @CurrentUser('id') userId: string): Promise<any> {
    return { success: true, data: await this.teamsService.create(body.name, userId) };
  }

  // ─── Members ───────────────────────────────────

  @Get('members')
  @RequireRole('OWNER', 'ADMIN', 'VA', 'VIEWER')
  async getMembers(@CurrentUser('teamId') teamId: string): Promise<any> {
    return { success: true, data: await this.teamsService.getMembers(teamId) };
  }

  @Patch('members/:memberId')
  @RequireRole('OWNER', 'ADMIN')
  async updateRole(
    @CurrentUser('teamId') teamId: string,
    @CurrentUser('id') userId: string,
    @Param('memberId') memberId: string,
    @Body() body: { role: TeamRole },
  ): Promise<any> {
    return { success: true, data: await this.teamsService.updateMemberRole(teamId, memberId, body.role, userId) };
  }

  @Delete('members/:memberId')
  @RequireRole('OWNER', 'ADMIN')
  async removeMember(
    @CurrentUser('teamId') teamId: string,
    @CurrentUser('id') userId: string,
    @Param('memberId') memberId: string,
  ): Promise<any> {
    await this.teamsService.removeMember(teamId, memberId, userId);
    return { success: true };
  }

  // ─── Invites ───────────────────────────────────

  @Post('invites')
  @RequireRole('OWNER', 'ADMIN')
  async createInvite(
    @CurrentUser('teamId') teamId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { email: string; role: TeamRole },
  ): Promise<any> {
    return { success: true, data: await this.teamsService.createInvite(teamId, body.email, body.role, userId) };
  }

  @Get('invites')
  @RequireRole('OWNER', 'ADMIN')
  async getInvites(@CurrentUser('teamId') teamId: string): Promise<any> {
    return { success: true, data: await this.teamsService.getInvites(teamId) };
  }

  @Delete('invites/:inviteId')
  @RequireRole('OWNER', 'ADMIN')
  async revokeInvite(
    @CurrentUser('teamId') teamId: string,
    @Param('inviteId') inviteId: string,
  ): Promise<any> {
    await this.teamsService.revokeInvite(teamId, inviteId);
    return { success: true };
  }
}
