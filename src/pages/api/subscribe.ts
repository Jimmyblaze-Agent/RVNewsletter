import type { APIRoute } from 'astro';

export const prerender = false;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request }) => {
  const headers = { 'Content-Type': 'application/json' };

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON body' }),
      { status: 400, headers }
    );
  }

  const { email } = body as Record<string, unknown>;

  // Input validation
  if (!email || typeof email !== 'string') {
    return new Response(
      JSON.stringify({ success: false, error: 'Email is required' }),
      { status: 400, headers }
    );
  }

  const trimmedEmail = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid email address' }),
      { status: 400, headers }
    );
  }

  const apiKey = import.meta.env.AGENTMAIL_API_KEY ?? process.env.AGENTMAIL_API_KEY;
  const inboxId = import.meta.env.AGENTMAIL_INBOX_ID ?? process.env.AGENTMAIL_INBOX_ID;

  if (!apiKey || !inboxId) {
    console.error('[subscribe] Missing AGENTMAIL_API_KEY or AGENTMAIL_INBOX_ID env vars');
    return new Response(
      JSON.stringify({ success: false, error: 'Server configuration error' }),
      { status: 500, headers }
    );
  }

  const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Free Boondocking Guide is Here!</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #1a5c2a; padding: 32px 24px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 26px; margin: 0 0 8px; }
    .header p { color: #a8d5b5; font-size: 15px; margin: 0; }
    .body { padding: 32px 24px; color: #333333; font-size: 16px; line-height: 1.6; }
    .body h2 { color: #1a5c2a; font-size: 20px; margin-top: 0; }
    .cta-btn { display: inline-block; margin: 24px 0; padding: 14px 32px; background-color: #2e7d32; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 17px; font-weight: bold; }
    .features { background-color: #f0f7f1; border-left: 4px solid #2e7d32; padding: 16px 20px; border-radius: 4px; margin: 20px 0; }
    .features ul { margin: 0; padding-left: 18px; }
    .features li { margin-bottom: 8px; }
    .footer { background-color: #263238; padding: 20px 24px; text-align: center; color: #90a4ae; font-size: 12px; }
    .emoji { font-size: 20px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🏕️ RV Nomad News</h1>
      <p>Your off-grid adventure starts now!</p>
    </div>
    <div class="body">
      <h2>You're In — Welcome to the Tribe!</h2>
      <p>Hey there, fellow road warrior! 👋</p>
      <p>
        Thanks for signing up for <strong>RV Nomad News</strong>. You just joined over 5,000 RVers
        who are discovering America's most breathtaking — and completely <em>free</em> — camping spots.
      </p>
      <p>
        As promised, here's your free PDF guide:
      </p>
      <p style="text-align: center;">
        <a class="cta-btn" href="https://drive.google.com/uc?export=download&id=1TMvFJnZOdW_7bBADhjPaS5kgIVJg_cEk" target="_blank">
          📥 Download: 100 Best Free Boondocking Spots
        </a>
      </p>
      <div class="features">
        <strong>Inside your guide you'll find:</strong>
        <ul>
          <li>100 hand-picked, legal boondocking spots across the USA</li>
          <li>Exact GPS coordinates for offline navigation</li>
          <li>Cell service ratings at each location</li>
          <li>Best seasons to visit and rig-size notes</li>
        </ul>
      </div>
      <p>
        Save it to your phone for when you're off the grid — no signal needed! 📡
      </p>
      <p>
        Stay tuned: we'll be sending you more off-grid tips, hidden gem locations, and
        money-saving tricks for life on the road. Every email is worth opening.
      </p>
      <p>Happy trails,<br/><strong>The RV Nomad News Crew 🚐</strong></p>
    </div>
    <div class="footer">
      <p>You received this because you signed up at rv-newsletter.vercel.app</p>
      <p>© 2026 RV Nomad News · Unsubscribe anytime by replying with "unsubscribe"</p>
    </div>
  </div>
</body>
</html>`;

  const emailText = `Welcome to RV Nomad News! 🏕️

Hey there, fellow road warrior!

Thanks for signing up for RV Nomad News. You're now part of a community of 5,000+ RVers discovering America's most breathtaking — and completely free — camping spots.

Here's your free PDF guide:
👉 https://drive.google.com/uc?export=download&id=1TMvFJnZOdW_7bBADhjPaS5kgIVJg_cEk

Inside you'll find:
- 100 hand-picked, legal boondocking spots across the USA
- Exact GPS coordinates for offline navigation
- Cell service ratings at each location
- Best seasons to visit and rig-size notes

Save it to your phone for offline access — no signal needed!

We'll also be sending you more off-grid tips, hidden gem locations, and money-saving tricks. Every email is worth opening.

Happy trails,
The RV Nomad News Crew 🚐

---
You received this because you signed up at rv-newsletter.vercel.app
Unsubscribe anytime by replying with "unsubscribe".`;

  try {
    const apiUrl = `https://api.agentmail.to/v0/inboxes/${inboxId}/messages`;

    const agentMailResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: [trimmedEmail],
        subject: 'Your Free Boondocking Guide is Here! 🏕️',
        text: emailText,
        html: emailHtml,
      }),
    });

    if (!agentMailResponse.ok) {
      const errorBody = await agentMailResponse.text();
      console.error(`[subscribe] AgentMail API error ${agentMailResponse.status}:`, errorBody);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send email. Please try again.' }),
        { status: 502, headers }
      );
    }

    console.log(`[subscribe] Welcome email sent successfully to: ${trimmedEmail}`);
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers }
    );
  } catch (err) {
    console.error('[subscribe] Unexpected error sending email:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected error occurred. Please try again.' }),
      { status: 500, headers }
    );
  }
};
