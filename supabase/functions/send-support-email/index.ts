// Supabase Edge Function — sends a compiled support ticket to the
// Comet support inbox via the Resend API.
//
// Deploy:
//   supabase functions deploy send-support-email --project-ref repcgsqitncgvwegkuyf
//   supabase secrets set RESEND_API_KEY=... SUPPORT_EMAIL=dara.egmp05a@iimtrichy.ac.in
//
// Invoke:
//   POST /functions/v1/send-support-email
//   { "subject": "...", "body": "...", "replyTo": "customer@email" }

const SUPPORT_EMAIL = Deno.env.get('SUPPORT_EMAIL') ?? 'hello@wearcomet.com';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
    });
  }
  const { subject, body, replyTo } = await req.json();
  if (!subject || !body) {
    return new Response(JSON.stringify({ error: 'subject and body required' }), { status: 400 });
  }
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ sent: false, reason: 'no_api_key' }), { status: 503 });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Comet Support Bot <onboarding@resend.dev>',
      to: [SUPPORT_EMAIL],
      reply_to: replyTo,
      subject,
      text: body,
    }),
  });

  return new Response(
    JSON.stringify(res.ok ? { sent: true, to: SUPPORT_EMAIL } : { sent: false, reason: `provider_${res.status}` }),
    { status: res.ok ? 200 : 502, headers: { 'Content-Type': 'application/json' } }
  );
});
