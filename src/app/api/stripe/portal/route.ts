import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createPortalSession } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });
    
    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 400 }
      );
    }
    
    const portalSession = await createPortalSession(subscription.stripeCustomerId);
    
    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}

