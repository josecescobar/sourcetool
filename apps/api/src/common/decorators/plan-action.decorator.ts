import { SetMetadata } from '@nestjs/common';

export const PLAN_ACTION_KEY = 'planAction';
export type PlanActionType = 'lookup' | 'bulk_scan' | 'ai_verdict' | 'export' | 'team_invite';
export const PlanAction = (action: PlanActionType) => SetMetadata(PLAN_ACTION_KEY, action);
