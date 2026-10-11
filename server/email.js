// Sends the compiled support ticket to the configured support address.
// Uses the Resend API (https://resend.com) — free tier works without a
// domain for the signup mailbox. Returns true only on provider success.
export async function sendSupportEmail({ to, subject, body, replyTo }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, reason: 'no_api_key' };

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Comet Support Bot <onboarding@resend.dev>',
        to: [to],
        reply_to: replyTo || undefined,
        subject,
        text: body,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error('Resend error:', res.status, t.slice(0, 200));
      return { sent: false, reason: `provider_${res.status}` };
    }
    return { sent: true };
  } catch (e) {
    console.error('Email send failed:', e.message);
    return { sent: false, reason: 'network' };
  }
}
