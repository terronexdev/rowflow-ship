import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { registerSchema } from '@/lib/validations';
import { log } from '@/lib/logger';
import { acceptPendingInvitesForEmail, ensureMemberAndRole } from '@/lib/projectAccess';
import { SUBSCRIPTION_TIERS } from '@/lib/constants/subscription';
import { ensureCompedProIfEligible } from '@/lib/billing/comped';

export async function POST(req: NextRequest) {
  let body: any;

  try {
    body = await req.json();

    const validatedData = registerSchema.parse(body);
    const inviteToken = typeof body.inviteToken === 'string' ? body.inviteToken : null;

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    let invite = null as null | {
      id: string;
      projectId: string;
      email: string;
      role: any;
      expiresAt: Date;
      status: string;
    };
    if (inviteToken) {
      invite = await prisma.projectInvite.findUnique({ where: { token: inviteToken } });
      if (!invite || invite.status !== 'PENDING' || invite.expiresAt < new Date()) {
        return NextResponse.json({ error: 'Invite is invalid or expired' }, { status: 400 });
      }
      if (invite.email.toLowerCase() !== validatedData.email.toLowerCase()) {
        return NextResponse.json(
          { error: 'Register with the invited email address' },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: 'USER',
      },
    });

    const free = SUBSCRIPTION_TIERS.FREE;
    await prisma.subscription.create({
      data: {
        userId: user.id,
        stripeCustomerId: null,
        tier: 'FREE',
        status: 'ACTIVE',
        projectLimit: free.projectLimit,
        parcelLimitPerProject: free.parcelLimitPerProject,
        userLimit: free.userLimit,
        storageLimit: free.storageLimit,
      },
    });

    await ensureCompedProIfEligible(user.id, user.email);

    let invitesAccepted = 0;
    if (invite) {
      await ensureMemberAndRole(invite.projectId, user.id, invite.role);
      await prisma.projectInvite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      });
      invitesAccepted = 1;
    }
    invitesAccepted += await acceptPendingInvitesForEmail(user.email, user.id);

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        invitesAccepted,
      },
      { status: 201 }
    );
  } catch (error) {
    log.error('User registration failed', error instanceof Error ? error : new Error(String(error)), {
      email: body?.email,
      hasPassword: !!body?.password,
    });

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
