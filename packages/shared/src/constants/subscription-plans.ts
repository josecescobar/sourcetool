export type PlanTier = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface PlanConfig {
  tier: PlanTier;
  name: string;
  price: number; // monthly in cents
  lookupsPerDay: number;
  bulkScansPerMonth: number;
  maxBulkScanRows: number;
  aiVerdicts: boolean;
  maxTeamMembers: number;
  features: string[];
}

export const SUBSCRIPTION_PLANS: Record<PlanTier, PlanConfig> = {
  FREE: {
    tier: 'FREE',
    name: 'Free',
    price: 0,
    lookupsPerDay: 10,
    bulkScansPerMonth: 0,
    maxBulkScanRows: 0,
    aiVerdicts: false,
    maxTeamMembers: 1,
    features: ['Basic product lookup', 'Profit calculator', 'Price history'],
  },
  STARTER: {
    tier: 'STARTER',
    name: 'Starter',
    price: 1495,
    lookupsPerDay: 100,
    bulkScansPerMonth: 5,
    maxBulkScanRows: 500,
    aiVerdicts: false,
    maxTeamMembers: 2,
    features: [
      'Everything in Free',
      '100 lookups/day',
      '5 bulk scans/month',
      'CSV export',
      '2 team members',
    ],
  },
  PROFESSIONAL: {
    tier: 'PROFESSIONAL',
    name: 'Professional',
    price: 2495,
    lookupsPerDay: 500,
    bulkScansPerMonth: 30,
    maxBulkScanRows: 5000,
    aiVerdicts: true,
    maxTeamMembers: 5,
    features: [
      'Everything in Starter',
      '500 lookups/day',
      '30 bulk scans/month',
      'AI deal verdicts',
      'Google Sheets export',
      '5 team members',
    ],
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    price: 4995,
    lookupsPerDay: Infinity,
    bulkScansPerMonth: Infinity,
    maxBulkScanRows: Infinity,
    aiVerdicts: true,
    maxTeamMembers: Infinity,
    features: [
      'Everything in Professional',
      'Unlimited lookups',
      'Unlimited bulk scans',
      'Unlimited team members',
      'Priority support',
      'API access',
    ],
  },
};
