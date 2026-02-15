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
    features: ['Basic extension + dashboard', '10 lookups/day', 'Profit calculator', 'Price history'],
  },
  STARTER: {
    tier: 'STARTER',
    name: 'Starter',
    price: 1900,
    lookupsPerDay: Infinity,
    bulkScansPerMonth: 500,
    maxBulkScanRows: 500,
    aiVerdicts: false,
    maxTeamMembers: 1,
    features: [
      'Everything in Free',
      'Unlimited lookups',
      '500 bulk scans/month',
      'Basic alerts',
      'CSV export',
    ],
  },
  PROFESSIONAL: {
    tier: 'PROFESSIONAL',
    name: 'Pro',
    price: 2900,
    lookupsPerDay: Infinity,
    bulkScansPerMonth: Infinity,
    maxBulkScanRows: 5000,
    aiVerdicts: true,
    maxTeamMembers: 2,
    features: [
      'Everything in Starter',
      'Unlimited bulk scans',
      'AI deal verdicts',
      'Google Sheets export',
      'Price/BSR alerts',
      '2 team members',
    ],
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    price: 4900,
    lookupsPerDay: Infinity,
    bulkScansPerMonth: Infinity,
    maxBulkScanRows: Infinity,
    aiVerdicts: true,
    maxTeamMembers: 10,
    features: [
      'Everything in Pro',
      'Unlimited everything',
      '10 team members',
      'API access',
      'Priority support',
    ],
  },
};
