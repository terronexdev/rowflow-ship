/**
 * Transactional email via Resend.
 * Requires RESEND_API_KEY. From: ROWFLOW_EMAIL_FROM || EMAIL_FROM || default.
 */
export function getEmailFrom() {
  return (
    process.env.ROWFLOW_EMAIL_FROM ||
    process.env.EMAIL_FROM ||
    'ROWFlow <noreply@terronex.dev>'
  );
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(opts: {
  to: string[];
  subject: string;
  text: string;
  html?: string;
}): Promise<{ ok: true; id?: string } | { ok: false; error: string; status: number }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      error: 'Email not configured (RESEND_API_KEY). Add it in Vercel env for production.',
    };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getEmailFrom(),
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { ok: false, status: 502, error: `Email provider error: ${err}` };
  }

  const data = (await res.json().catch(() => ({}))) as { id?: string };
  return { ok: true, id: data.id };
}
