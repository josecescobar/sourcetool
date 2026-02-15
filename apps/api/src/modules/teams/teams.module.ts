import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamInvitesController } from './team-invites.controller';
import { TeamsService } from './teams.service';

@Module({
  controllers: [TeamsController, TeamInvitesController],
  providers: [TeamsService],
})
export class TeamsModule {}
