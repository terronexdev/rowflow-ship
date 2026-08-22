import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureMemberAndRole, getOwnedProject } from '@/lib/projectAccess';
import { isEmailConfigured, sendEmail } from '@/lib/email/send';
import { z } from 'zod';
import type { AssignmentRole } from '@prisma/client';
import { assignmentRoleEnum } from '@/lib/validations';

const inviteSchema = z.object({
  email: z.string().email(),
  role: assignmentRoleEnum.default('AGENT'),
});

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: {
      id,
      OR: [
        { userId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
  });
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [members, invites] = await Promise.all([
    prisma.projectMember.findMany({
      where: { projectId: id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.projectInvite.findMany({
      where: { projectId: id, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const appUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://rowflow-alpha.vercel.app';

  return NextResponse.json({
    ownerId: project.userId,
    members,
    invites: invites.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      status: i.status,
      expiresAt: i.expiresAt,
      createdAt: i.createdAt,
      inviteUrl:
        project.userId === session.user.id
          ? `${appUrl}/register?invite=${i.token}&email=${encodeURIComponent(i.email)}`
          : undefined,
    })),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const owner = await getOwnedProject(id, session.user.id);
    if (!owner) {
      return NextResponse.json({ error: 'Only the project owner can invite' }, { status: 403 });
    }

    const body = inviteSchema.parse(await req.json());
    const email = body.email.trim().toLowerCase();
    const role = body.role as AssignmentRole;

    if (email === session.user.email?.toLowerCase()) {
      return NextResponse.json({ error: 'You already own this project' }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (existingUser) {
      await ensureMemberAndRole(id, existingUser.id, role);
      await prisma.projectInvite.updateMany({
        where: {
          projectId: id,
          email: { equals: email, mode: 'insensitive' },
          status: 'PENDING',
        },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      });

      return NextResponse.json({
        status: 'added',
        message: `${existingUser.name || existingUser.email} added to the project as ${role.replaceAll('_', ' ')}`,
        user: { id: existingUser.id, name: existingUser.name, email: existingUser.email },
      });
    }

    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    await prisma.projectInvite.updateMany({
      where: {
        projectId: id,
        email: { equals: email, mode: 'insensitive' },
        status: 'PENDING',
      },
      data: { status: 'REVOKED' },
    });
    const invite = await prisma.projectInvite.create({
      data: {
        projectId: id,
        email,
        role,
        token,
        invitedById: session.user.id,
        expiresAt,
      },
    });

    const appUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://rowflow-alpha.vercel.app';
    const inviteUrl = `${appUrl}/register?invite=${token}&email=${encodeURIComponent(email)}`;

    let emailSent = false;
    let emailError: string | undefined;
    const roleLabel = role.replaceAll('_', ' ');
    const inviter = session.user.name || session.user.email || 'A teammate';
    const textBody = [
      `${inviter} invited you to the ROWFlow project "${owner.name}" as ${roleLabel}.`,
      '',
      'Open this link to create your account (use this email address):',
      inviteUrl,
      '',
      `This invite expires ${expiresAt.toISOString().slice(0, 10)}.`,
      '',
      '— Terronex ROWFlow',
    ].join('\n');
    const htmlBody = `
      <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a">
        <p><strong>${escapeHtml(String(inviter))}</strong> invited you to
        <strong>${escapeHtml(owner.name)}</strong> on ROWFlow
        as <strong>${escapeHtml(roleLabel)}</strong>.</p>
        <p><a href="${inviteUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">
          Accept invite
        </a></p>
        <p style="font-size:13px;color:#64748b">Or paste this link:<br/>
        <a href="${inviteUrl}">${inviteUrl}</a></p>
        <p style="font-size:12px;color:#94a3b8">Expires ${expiresAt.toISOString().slice(0, 10)}. Use the invited email when signing up (Google with that account is fine).</p>
      </div>`;

    if (isEmailConfigured()) {
      const result = await sendEmail({
        to: [email],
        subject: `You're invited to ${owner.name} on ROWFlow`,
        text: textBody,
        html: htmlBody,
      });
      emailSent = result.ok;
      if (!result.ok) emailError = result.error;
    } else {
      emailError = 'RESEND_API_KEY not configured';
    }

    return NextResponse.json(
      {
        status: 'invited',
        message: emailSent
          ? `Invite emailed to ${email}`
          : `Invite created for ${email}. Share the link${emailError ? ` (email: ${emailError})` : ''}.`,
        invite: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          expiresAt: invite.expiresAt,
          inviteUrl,
        },
        emailSent,
        emailError,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const owner = await getOwnedProject(id, session.user.id);
    if (!owner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const inviteId = req.nextUrl.searchParams.get('inviteId');
    const memberId = req.nextUrl.searchParams.get('memberId');

    if (inviteId) {
      await prisma.projectInvite.updateMany({
        where: { id: inviteId, projectId: id },
        data: { status: 'REVOKED' },
      });
      // Also clear role assignments when removing member access
      return NextResponse.json({ ok: true });
    }
    if (memberId) {
      const member = await prisma.projectMember.findFirst({
        where: { id: memberId, projectId: id },
      });
      if (member) {
        await prisma.roleAssignment.updateMany({
          where: { projectId: id, userId: member.userId, isCurrent: true },
          data: { isCurrent: false, effectiveTo: new Date() },
        });
        await prisma.projectMember.deleteMany({ where: { id: memberId, projectId: id } });
      }
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'inviteId or memberId required' }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed' },
      { status: 400 }
    );
  }
}
