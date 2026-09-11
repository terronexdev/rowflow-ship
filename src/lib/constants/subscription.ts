/**
 * Subscription tiers — Free / Pro / Enterprise
 * BASIC kept for Stripe webhook backward-compat only.
 */

export type SubscriptionTiers = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';

export interface SubscriptionLimits {
  tier: SubscriptionTiers;
  name: string;
  price: number; // Monthly USD
  projectLimit: number;
  parcelLimitPerProject: number;
  userLimit: number;
  storageLimit: number; // MB
  features: string[];
}

/** Emails / domains that always get full Pro (no charge). */
export function isTerronexCompedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  if (e.endsWith('@terronex.dev')) return true;
  // Owner / tester accounts
  if (e === 'terronex.dev@gmail.com') return true;
  if (e === 'jsokiraps@gmail.com') return true;
  if (e === 'jmsokira@gmail.com') return true;
  return false;
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTiers, SubscriptionLimits> = {
  FREE: {
    tier: 'FREE',
    name: 'Free',
    price: 0,
    projectLimit: 2,
    parcelLimitPerProject: 50,
    userLimit: 1,
    storageLimit: 100,
    features: [
      '2 projects (your own)',
      'Up to 50 parcels per project',
      'Full single-player toolset (map, statuses, matrix, labor)',
      'CSV / GeoJSON export',
      '1 user seat',
      '100 MB storage',
    ],
  },
  // BASIC kept for Stripe/webhook backward-compat; not sold
  BASIC: {
    tier: 'BASIC',
    name: 'Basic (legacy)',
    price: 29,
    projectLimit: 10,
    parcelLimitPerProject: 200,
    userLimit: 3,
    storageLimit: 1024,
    features: ['Legacy tier — use Pro'],
  },
  PRO: {
    tier: 'PRO',
    name: 'Pro',
    price: 99,
    projectLimit: 20,
    parcelLimitPerProject: 200,
    userLimit: 15,
    storageLimit: 10240,
    features: [
      '20 projects',
      'Up to 200 parcels per project',
      'Team invites & roles',
      'PTS, title, acquisition & full status suite',
      'Land payment matrix + Create Take (no auto offers)',
      'ROWScope budget seed + per-parcel lines',
      'Contacts, Activity, who+when attribution',
      'Labor tracking + reporting / analytics',
      'Document storage (10 GB)',
      'Includes Tractsource (suite seat)',
      'Email support',
    ],
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    price: 0,
    projectLimit: -1,
    parcelLimitPerProject: -1,
    userLimit: -1,
    storageLimit: -1,
    features: [
      'Everything in Pro',
      'Unlimited users',
      'SSO / custom contracts',
      'Dedicated support',
    ],
  },
};

export const STRIPE_PRICE_IDS = {
  /** Primary sold plan — $99/mo · price_1TyfGsGZGFEXOFolGmkBYSBN */
  PRO: process.env.STRIPE_PRO_PRICE_ID || process.env.STRIPE_PRICE_ID || '',
  BASIC: process.env.STRIPE_BASIC_PRICE_ID || '',
} as const;

export function getSubscriptionLimits(tier: SubscriptionTiers): SubscriptionLimits {
  return SUBSCRIPTION_TIERS[tier];
}

export function hasUnlimitedProjects(tier: SubscriptionTiers): boolean {
  return SUBSCRIPTION_TIERS[tier].projectLimit === -1;
}

export function hasUnlimitedParcels(tier: SubscriptionTiers): boolean {
  return SUBSCRIPTION_TIERS[tier].parcelLimitPerProject === -1;
}

export function getSubscriptionTiersName(tier: SubscriptionTiers): string {
  return SUBSCRIPTION_TIERS[tier].name;
}

export function formatLimit(limit: number): string {
  return limit === -1 ? 'Unlimited' : limit.toString();
}

/** Limits object for granting Pro (comped or paid) */
export function proLimitFields() {
  const t = SUBSCRIPTION_TIERS.PRO;
  return {
    tier: 'PRO' as const,
    status: 'ACTIVE' as const,
    projectLimit: t.projectLimit,
    parcelLimitPerProject: t.parcelLimitPerProject,
    userLimit: t.userLimit,
    storageLimit: t.storageLimit,
  };
}

/** Defaults when creating a FREE subscription row */
export function freeLimitFields() {
  const t = SUBSCRIPTION_TIERS.FREE;
  return {
    tier: 'FREE' as const,
    status: 'ACTIVE' as const,
    projectLimit: t.projectLimit,
    parcelLimitPerProject: t.parcelLimitPerProject,
    userLimit: t.userLimit,
    storageLimit: t.storageLimit,
  };
}
