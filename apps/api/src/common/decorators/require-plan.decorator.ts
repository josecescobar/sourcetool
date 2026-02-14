import { SetMetadata } from '@nestjs/common';

export const PLAN_KEY = 'requiredPlan';
export const RequirePlan = (...plans: string[]) => SetMetadata(PLAN_KEY, plans);
