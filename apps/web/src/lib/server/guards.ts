import { prisma } from '@sourcetool/db';
import { SUBSCRIPTION_PLANS } from '@sourcetool/shared';
import type { PlanTier } from '@sourcetool/shared';
import { ApiError, PlanLimitError } from './http';
import { requireAuth, type AuthUser } from './auth/jwt';

export type TeamRole = 'OWNER' | 'ADMIN' | 'VA' | 'VIEWER';
export type PlanActionType = 'lookup' | 'bulk_scan' | 'ai_verdict' | 'export' | 'team_invite';

export type TeamContext = {
  user: AuthUser;
  teamId: string;
  role: TeamRole;
  member: { id: string; teamId: string; userId: string; role: TeamRole };
};

export async function requireTeamRole(req: Request, roles: TeamRole[]): Promise<TeamContext> {
  const user = await requireAuth(req);
  const teamId = user.teamId;

  if (!user.id || !teamId) {
    throw new ApiError(403, 'Team context required');
  }

  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: user.id } },
  });

  if (!member) {
    throw new ApiError(403, 'Not a member of this team');
  }

  if (!roles.includes(member.role as TeamRole)) {
    throw new ApiError(403, 'Insufficient role');
  }

  return {
    user,
    teamId,
    role: member.role as TeamRole,
    member: {
      id: member.id,
      teamId: member.teamId,
      userId: member.userId,
      role: member.role as TeamRole,
    },
  };
}

function startOfUtcDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function incrementUsage(teamId: string, date: Date, field: string) {
  await prisma.usageRecord.upsert({
    where: { teamId_date: { teamId, date } },
    update: { [field]: { increment: 1 } },
    create: { teamId, date, [field]: 1 },
  });
}

export async function enforcePlanLimit(teamId: string | undefined, action: PlanActionType) {
  if (!teamId) return;

  const subscription = await prisma.subscription.findUnique({ where: { teamId } });
  const planTier = (subscription?.planTier || 'FREE') as PlanTier;
  const plan = SUBSCRIPTION_PLANS[planTier];
  const today = startOfUtcDay();

  switch (action) {
    case 'lookup': {
      if (plan.lookupsPerDay === Infinity) break;
      const record = await prisma.usageRecord.findUnique({
        where: { teamId_date: { teamId, date: today } },
      });
      const current = record?.lookupCount || 0;
      if (current >= plan.lookupsPerDay) {
        throw new PlanLimitError({
          error: 'Plan limit reached',
          feature: 'lookup',
          limit: plan.lookupsPerDay,
          current,
        });
      }
      await incrementUsage(teamId, today, 'lookupCount');
      break;
    }
    case 'bulk_scan': {
      if (plan.bulkScansPerMonth === Infinity) break;
      if (plan.bulkScansPerMonth === 0) {
        throw new PlanLimitError({
          error: 'Plan limit reached',
          feature: 'bulk_scan',
          limit: 0,
          current: 0,
        });
      }
      const periodStart =
        subscription?.currentPeriodStart || new Date(today.getFullYear(), today.getMonth(), 1);
      const agg = await prisma.usageRecord.aggregate({
        where: { teamId, date: { gte: periodStart } },
        _sum: { bulkScanCount: true },
      });
      const current = agg._sum.bulkScanCount || 0;
      if (current >= plan.bulkScansPerMonth) {
        throw new PlanLimitError({
          error: 'Plan limit reached',
          feature: 'bulk_scan',
          limit: plan.bulkScansPerMonth,
          current,
        });
      }
      await incrementUsage(teamId, today, 'bulkScanCount');
      break;
    }
    case 'ai_verdict': {
      if (!plan.aiVerdicts) {
        throw new PlanLimitError({
          error: 'Plan limit reached',
          feature: 'ai_verdict',
          limit: 0,
          current: 0,
        });
      }
      await incrementUsage(teamId, today, 'aiVerdictCount');
      break;
    }
    case 'export': {
      if (planTier !== 'PROFESSIONAL' && planTier !== 'ENTERPRISE') {
        throw new PlanLimitError({
          error: 'Plan limit reached',
          feature: 'export',
          limit: 0,
          current: 0,
        });
      }
      await incrementUsage(teamId, today, 'exportCount');
      break;
    }
    case 'team_invite': {
      const memberCount = await prisma.teamMember.count({ where: { teamId } });
      if (memberCount >= plan.maxTeamMembers) {
        throw new PlanLimitError({
          error: 'Plan limit reached',
          feature: 'team_invite',
          limit: plan.maxTeamMembers,
          current: memberCount,
        });
      }
      break;
    }
  }
}

const forgotPasswordHits = new Map<string, { count: number; resetAt: number }>();

export function rateLimitForgotPassword(key: string, limit = 3, windowMs = 60_000) {
  const now = Date.now();
  const current = forgotPasswordHits.get(key);
  if (!current || now > current.resetAt) {
    forgotPasswordHits.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (current.count >= limit) {
    throw new ApiError(429, 'Too many requests');
  }
  current.count += 1;
}
