import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/require-role.decorator';
import { prisma } from '@sourcetool/db';

@Injectable()
export class TeamMemberGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const teamId = request.params?.teamId || request.body?.teamId || request.query?.teamId;

    if (!userId || !teamId) {
      throw new ForbiddenException('Team context required');
    }

    const member = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this team');
    }

    if (requiredRoles && !requiredRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient role');
    }

    request.teamMember = member;
    return true;
  }
}
