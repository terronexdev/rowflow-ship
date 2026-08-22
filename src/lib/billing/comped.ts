import { prisma } from '@/lib/prisma';
import { isTerronexCompedEmail, proLimitFields } from '@/lib/constants/subscription';

/**
 * Ensure Terronex staff emails always have PRO access.
 * Safe to call on register and login.
 */
export async function ensureCompedProIfEligible(userId: string, email: string | null | undefined) {
  if (!isTerronexCompedEmail(email)) return false;

  const limits = proLimitFields();
  await prisma.subscription.upsert({
    where: { userId },
    update: {
      ...limits,
      // don't wipe stripe ids if they somehow paid
    },
    create: {
      userId,
      stripeCustomerId: null,
      ...limits,
    },
  });
  return true;
}
