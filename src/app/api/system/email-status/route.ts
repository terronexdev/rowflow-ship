import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isEmailConfigured, getEmailFrom } from '@/lib/email/send';

/** GET /api/system/email-status — ops visibility (auth required) */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const configured = isEmailConfigured();
  return NextResponse.json({
    configured,
    from: configured ? getEmailFrom() : null,
    provider: 'resend',
    hint: configured
      ? 'Counter-offer and invite emails can send.'
      : 'Set RESEND_API_KEY and ROWFLOW_EMAIL_FROM (or EMAIL_FROM) on Vercel, then redeploy.',
    missing: [
      !process.env.RESEND_API_KEY ? 'RESEND_API_KEY' : null,
      !(process.env.ROWFLOW_EMAIL_FROM || process.env.EMAIL_FROM) ? 'ROWFLOW_EMAIL_FROM' : null,
    ].filter(Boolean),
  });
}
