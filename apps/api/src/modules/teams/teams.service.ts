import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@sourcetool/db';
import type { TeamRole } from '@sourcetool/shared';

@Injectable()
export class TeamsService {
  async create(name: string, ownerId: string): Promise<any> {
    return prisma.team.create({
      data: {
        name,
        ownerId,
        members: {
          create: { userId: ownerId, role: 'OWNER', joinedAt: new Date() },
        },
        subscription: {
          create: { planTier: 'FREE', status: 'ACTIVE' },
        },
      },
      include: { members: true, subscription: true },
    });
  }

  async invite(teamId: string, email: string, role: TeamRole): Promise<any> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    return prisma.teamMember.create({
      data: { teamId, userId: user.id, role: role as any },
    });
  }

  async updateMemberRole(teamId: string, memberId: string, role: TeamRole): Promise<any> {
    return prisma.teamMember.update({
      where: { id: memberId },
      data: { role: role as any },
    });
  }

  async removeMember(teamId: string, memberId: string): Promise<any> {
    const member = await prisma.teamMember.findUnique({ where: { id: memberId } });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'OWNER') throw new ForbiddenException('Cannot remove team owner');
    return prisma.teamMember.delete({ where: { id: memberId } });
  }
}
