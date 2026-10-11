// Sends the compiled support ticket to the configured support address.
// Path 1: Resend API directly when RESEND_API_KEY is set locally.
// Path 2: the deployed Supabase edge function send-support-email,
//         which holds its own RESEND_API_KEY secret.
// Returns { sent: true } only on provider success.
export async function sendSupportEmail({ to, subject, body, replyTo, supabase }) {
  const key = process.env.RESEND_API_KEY;
  if (key) return sendViaResend({ key, to, subject, body, replyTo });

  // Gmail SMTP via nodemailer — needs an App Password, not the real one:
  // Google Account → Security → App passwords (requires 2-Step Verification).
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const nodemailer = (await import('nodemailer')).default;
      const t = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 465,
        secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await t.sendMail({
        from: `"Comet Support Bot" <${process.env.SMTP_USER}>`,
        to,
        replyTo,
        subject,
        text: body,
      });
      return { sent: true };
    } catch (e) {
      console.error('SMTP send failed:', e.message);
      return { sent: false, reason: 'smtp_failed' };
    }
  }

  // Fall back to the edge function (it owns the RESEND_API_KEY secret).
  if (supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('send-support-email', {
        body: { subject, body, replyTo },
      });
      if (error) {
        console.error('Edge function error:', error.message);
        return { sent: false, reason: 'edge_error' };
      }
      if (data?.sent) return { sent: true };
      return { sent: false, reason: data?.reason || 'edge_failed' };
    } catch (e) {
      console.error('Edge invoke failed:', e.message);
      return { sent: false, reason: 'edge_network' };
    }
  }
  return { sent: false, reason: 'no_api_key' };
}

async function sendViaResend({ key, to, subject, body, replyTo }) {

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
