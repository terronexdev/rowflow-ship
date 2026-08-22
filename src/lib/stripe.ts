import Stripe from 'stripe';
import { STRIPE_PRICE_IDS, SUBSCRIPTION_TIERS } from '@/lib/constants/subscription';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

export const stripe = new Stripe(stripeSecretKey || 'sk_test_placeholder', {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

export const STRIPE_PRICES = {
  PRO: STRIPE_PRICE_IDS.PRO,
  BASIC: STRIPE_PRICE_IDS.BASIC,
  // legacy aliases
  ENTERPRISE: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
};

// Re-export tier catalog for webhooks / UI
export { SUBSCRIPTION_TIERS, STRIPE_PRICE_IDS };

export async function createCheckoutSession(
  userId: string,
  priceId: string,
  email: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rowflow-alpha.vercel.app';

  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    allow_promotion_codes: true,
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?canceled=true`,
    metadata: { userId, tier: 'PRO' },
    subscription_data: {
      metadata: { userId, tier: 'PRO' },
    },
  });

  return session;
}

export async function createPortalSession(customerId: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rowflow-alpha.vercel.app';
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/settings`,
  });
  return session;
}

export async function getSubscriptionStatus(subscriptionId: string) {
  return stripe.subscriptions.retrieve(subscriptionId);
}

export function getTierFromPriceId(priceId: string): string {
  if (priceId && priceId === STRIPE_PRICES.PRO) return 'PRO';
  if (priceId && priceId === STRIPE_PRICES.BASIC) return 'BASIC';
  if (priceId && priceId === STRIPE_PRICES.ENTERPRISE) return 'ENTERPRISE';
  // Default paid unknown → PRO (single product strategy)
  if (priceId) return 'PRO';
  return 'FREE';
}
