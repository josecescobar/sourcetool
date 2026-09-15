import { prisma } from '@sourcetool/db';
import type { TeamRole } from '@sourcetool/shared';
import { EmailService } from '../email/email.service';
import { generateToken, hashToken } from '../auth/utils/token.util';
import { ApiError } from '../http';
import { runAfter } from '../after';

export class TeamsService {
  constructor(private emailService: EmailService) {}

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

  // ─── Members ──────────────────────────────────────────────────

  async getMembers(teamId: string): Promise<any> {
    return prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: { select: { id: true, email: true, name: true, avatarUrl: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async updateMemberRole(teamId: string, memberId: string, role: TeamRole, actorId: string): Promise<any> {
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
      include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
    });
    if (!member || member.teamId !== teamId) throw new ApiError(404, 'Member not found');
    if (member.role === 'OWNER') throw new ApiError(403, 'Cannot change owner role');
    if (member.userId === actorId) throw new ApiError(403, 'Cannot change your own role');

    // ADMIN cannot manage other ADMINs
    const actor = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: actorId } },
    });
    if (actor?.role === 'ADMIN' && member.role === 'ADMIN') {
      throw new ApiError(403, 'Admins cannot manage other admins');
    }

    return prisma.teamMember.update({
      where: { id: memberId },
      data: { role: role as any },
      include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
    });
  }

  async removeMember(teamId: string, memberId: string, actorId: string): Promise<any> {
    const member = await prisma.teamMember.findUnique({ where: { id: memberId } });
    if (!member || member.teamId !== teamId) throw new ApiError(404, 'Member not found');
    if (member.role === 'OWNER') throw new ApiError(403, 'Cannot remove team owner');
    if (member.userId === actorId) throw new ApiError(403, 'Cannot remove yourself');

    // ADMIN cannot remove other ADMINs
    const actor = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: actorId } },
    });
    if (actor?.role === 'ADMIN' && member.role === 'ADMIN') {
      throw new ApiError(403, 'Admins cannot remove other admins');
    }

    return prisma.teamMember.delete({ where: { id: memberId } });
  }

  // ─── Invites ──────────────────────────────────────────────────

  async createInvite(teamId: string, email: string, role: TeamRole, invitedBy: string): Promise<any> {
    // Cannot invite as OWNER
    if (role === 'OWNER') throw new ApiError(403, 'Cannot invite as owner');

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: existingUser.id } },
      });
      if (existingMember) throw new ApiError(409, 'User is already a team member');
    }

    // Delete existing invite for same email+team (re-invite)
    await prisma.teamInvite.deleteMany({ where: { teamId, email } });

    const rawToken = generateToken();
    const team = await prisma.team.findUnique({ where: { id: teamId }, select: { name: true } });

    const invite = await prisma.teamInvite.create({
      data: {
        teamId,
        email,
        role: role as any,
        token: hashToken(rawToken),
        invitedBy,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    runAfter(() =>
      this.emailService.sendTeamInviteEmail(email, rawToken, team?.name || 'your team'),
    );

    const webUrl = process.env.WEB_URL || 'http://localhost:3000';
    return { ...invite, inviteLink: `${webUrl}/invite?token=${rawToken}` };
  }

  async getInvites(teamId: string): Promise<any> {
    return prisma.teamInvite.findMany({
      where: { teamId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeInvite(teamId: string, inviteId: string): Promise<any> {
    const invite = await prisma.teamInvite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.teamId !== teamId) throw new ApiError(404, 'Invite not found');
    return prisma.teamInvite.delete({ where: { id: inviteId } });
  }

  async acceptInvite(token: string, userId: string): Promise<any> {
    const invite = await prisma.teamInvite.findFirst({
      where: { token: hashToken(token), expiresAt: { gt: new Date() } },
      include: { team: true },
    });
    if (!invite) throw new ApiError(400, 'Invalid or expired invite');

    // Check user isn't already a member
    const existing = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: invite.teamId, userId } },
    });
    if (existing) {
      await prisma.teamInvite.delete({ where: { id: invite.id } });
      throw new ApiError(409, 'Already a member of this team');
    }

    // Create member + delete invite in transaction
    const [member] = await prisma.$transaction([
      prisma.teamMember.create({
        data: {
          teamId: invite.teamId,
          userId,
          role: invite.role,
          joinedAt: new Date(),
        },
      }),
      prisma.teamInvite.delete({ where: { id: invite.id } }),
    ]);

    return { member, team: invite.team };
  }

  async getInviteInfo(token: string): Promise<any> {
    const invite = await prisma.teamInvite.findFirst({
      where: { token: hashToken(token), expiresAt: { gt: new Date() } },
      include: { team: { select: { id: true, name: true } } },
    });
    if (!invite) throw new ApiError(400, 'Invalid or expired invite');
    return { email: invite.email, role: invite.role, teamName: invite.team.name };
  }
}
