import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { prisma } from '@sourcetool/db';
import { SUBSCRIPTION_PLANS } from '@sourcetool/shared';
import type { PlanTier } from '@sourcetool/shared';
import { PLAN_ACTION_KEY, type PlanActionType } from '../decorators/plan-action.decorator';

@Injectable()
export class PlanLimitGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const action = this.reflector.getAllAndOverride<PlanActionType>(PLAN_ACTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @PlanAction decorator — pass through
    if (!action) return true;

    const request = context.switchToHttp().getRequest();
    const teamId = request.user?.teamId;
    if (!teamId) return true;

    const subscription = await prisma.subscription.findUnique({ where: { teamId } });
    const planTier = (subscription?.planTier || 'FREE') as PlanTier;
    const plan = SUBSCRIPTION_PLANS[planTier];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (action) {
      case 'lookup': {
        if (plan.lookupsPerDay === Infinity) break;
        const record = await prisma.usageRecord.findUnique({
          where: { teamId_date: { teamId, date: today } },
        });
        const current = record?.lookupCount || 0;
        if (current >= plan.lookupsPerDay) {
          throw new ForbiddenException({
            error: 'Plan limit reached',
            feature: 'lookup',
            limit: plan.lookupsPerDay,
            current,
          });
        }
        await this.incrementUsage(teamId, today, 'lookupCount');
        break;
      }
      case 'bulk_scan': {
        if (plan.bulkScansPerMonth === Infinity) break;
        if (plan.bulkScansPerMonth === 0) {
          throw new ForbiddenException({
            error: 'Plan limit reached',
            feature: 'bulk_scan',
            limit: 0,
            current: 0,
          });
        }
        const periodStart = subscription?.currentPeriodStart || new Date(today.getFullYear(), today.getMonth(), 1);
        const agg = await prisma.usageRecord.aggregate({
          where: { teamId, date: { gte: periodStart } },
          _sum: { bulkScanCount: true },
        });
        const current = agg._sum.bulkScanCount || 0;
        if (current >= plan.bulkScansPerMonth) {
          throw new ForbiddenException({
            error: 'Plan limit reached',
            feature: 'bulk_scan',
            limit: plan.bulkScansPerMonth,
            current,
          });
        }
        await this.incrementUsage(teamId, today, 'bulkScanCount');
        break;
      }
      case 'ai_verdict': {
        if (!plan.aiVerdicts) {
          throw new ForbiddenException({
            error: 'Plan limit reached',
            feature: 'ai_verdict',
            limit: 0,
            current: 0,
          });
        }
        await this.incrementUsage(teamId, today, 'aiVerdictCount');
        break;
      }
      case 'export': {
        if (planTier !== 'PROFESSIONAL' && planTier !== 'ENTERPRISE') {
          throw new ForbiddenException({
            error: 'Plan limit reached',
            feature: 'export',
            limit: 0,
            current: 0,
          });
        }
        await this.incrementUsage(teamId, today, 'exportCount');
        break;
      }
      case 'team_invite': {
        const memberCount = await prisma.teamMember.count({ where: { teamId } });
        if (memberCount >= plan.maxTeamMembers) {
          throw new ForbiddenException({
            error: 'Plan limit reached',
            feature: 'team_invite',
            limit: plan.maxTeamMembers,
            current: memberCount,
          });
        }
        break;
      }
    }

    return true;
  }

  private async incrementUsage(teamId: string, date: Date, field: string) {
    await prisma.usageRecord.upsert({
      where: { teamId_date: { teamId, date } },
      update: { [field]: { increment: 1 } },
      create: { teamId, date, [field]: 1 },
    });
  }
}
