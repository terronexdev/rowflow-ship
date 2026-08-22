import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createCheckoutSession, STRIPE_PRICES } from '@/lib/stripe';
import { isTerronexCompedEmail } from '@/lib/constants/subscription';
import { ensureCompedProIfEligible } from '@/lib/billing/comped';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const tier = (body.tier || 'PRO') as string;

    // Only Pro is sold
    if (tier !== 'PRO' && tier !== 'BASIC') {
      return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
    }

    if (isTerronexCompedEmail(session.user.email)) {
      await ensureCompedProIfEligible(session.user.id, session.user.email);
      return NextResponse.json({
        url: null,
        comped: true,
        message: 'Terronex accounts include Pro at no charge.',
      });
    }

    const priceId = STRIPE_PRICES.PRO;
    if (!priceId) {
      return NextResponse.json(
        { error: 'Stripe price not configured (STRIPE_PRO_PRICE_ID)' },
        { status: 500 }
      );
    }

    const checkoutSession = await createCheckoutSession(
      session.user.id,
      priceId,
      session.user.email!
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
