import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PLAN_KEY } from '../decorators/require-plan.decorator';
import { prisma } from '@sourcetool/db';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlans = this.reflector.getAllAndOverride<string[]>(PLAN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPlans) return true;

    const request = context.switchToHttp().getRequest();
    const teamId = request.params?.teamId || request.body?.teamId || request.query?.teamId;

    if (!teamId) return true;

    const subscription = await prisma.subscription.findUnique({
      where: { teamId },
    });

    if (!subscription || !requiredPlans.includes(subscription.planTier)) {
      throw new ForbiddenException(
        `This feature requires one of: ${requiredPlans.join(', ')}`,
      );
    }

    return true;
  }
}
