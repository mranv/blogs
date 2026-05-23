// Cloudflare Pages Function — /api/subscribe
// Fully Cloudflare-native: KV for subscriber storage, MailChannels for email delivery
// No third-party services required — $0/month

interface Env {
  SUBSCRIBERS_KV: KVNamespace;
  MAILCHANNELS_API_KEY?: string;
  ADMIN_EMAIL: string;
  SITE_NAME: string;
  SITE_URL: string;
}

interface SubscribeRequest {
  email: string;
  ref?: string;
}

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Disposable email domains to block
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', 'throwaway.email', 'guerrillamail.com',
  'mailinator.com', 'yopmail.com', 'sharklasers.com',
  'guerrillamailblock.com', 'grr.la', 'dispostable.com',
  'maildrop.cc', 'mailnesia.com', 'trashmail.com',
]);

function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email address is required.' };
  }
  const trimmed = email.trim();
  if (trimmed.length === 0) return { valid: false, error: 'Email address is required.' };
  if (trimmed.length > 254) return { valid: false, error: 'Email address is too long.' };
  if (!EMAIL_REGEX.test(trimmed)) return { valid: false, error: 'Please enter a valid email address.' };
  const domain = trimmed.split('@')[1]?.toLowerCase();
  if (domain && DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, error: 'Please use a permanent email address.' };
  }
  return { valid: true };
}

function jsonResponse(data: object, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Generate a random confirmation token
function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Send confirmation email via MailChannels (free for Cloudflare Workers)
async function sendConfirmationEmail(
  email: string,
  token: string,
  env: Env
): Promise<boolean> {
  const confirmUrl = `${env.SITE_URL || 'https://mranv.pages.dev'}/api/confirm?token=${token}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0d111b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#161b22;border-radius:16px;border:1px solid #30363d;">
    <tr>
      <td style="padding:40px 32px;">
        <h1 style="margin:0 0 8px;color:#e6edf3;font-size:24px;">Confirm your subscription</h1>
        <p style="margin:0 0 24px;color:#8b949e;font-size:15px;line-height:1.6;">
          You're almost there! Click the button below to confirm your subscription to
          <strong style="color:#e6edf3;">${env.SITE_NAME || 'Anubhav Gain\'s Blog'}</strong>.
          You'll get notified about new posts on security, Rust, eBPF, and DevSecOps.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <a href="${confirmUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;">
                Confirm Subscription
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:24px 0 0;color:#8b949e;font-size:13px;line-height:1.5;">
          Or paste this link into your browser:<br>
          <a href="${confirmUrl}" style="color:#6366f1;word-break:break-all;">${confirmUrl}</a>
        </p>
        <hr style="border:none;border-top:1px solid #30363d;margin:24px 0;">
        <p style="margin:0;color:#484f58;font-size:12px;">
          If you didn't subscribe, you can safely ignore this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textBody = `Confirm your subscription to ${env.SITE_NAME || "Anubhav Gain's Blog"}

Click here to confirm: ${confirmUrl}

If you didn't subscribe, you can safely ignore this email.`;

  try {
    const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: {
          email: `newsletter@${new URL(env.SITE_URL || 'https://mranv.pages.dev').hostname}`,
          name: env.SITE_NAME || "Anubhav Gain's Blog",
        },
        subject: 'Confirm your subscription ✨',
        content: [
          { type: 'text/plain', value: textBody },
          { type: 'text/html', value: htmlBody },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[subscribe] MailChannels error:', res.status, err);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[subscribe] MailChannels fetch error:', err);
    return false;
  }
}

// ── Main handler ────────────────────────────────────────────────
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const env = context.env;

  let body: SubscribeRequest;
  try {
    body = await context.request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid request body.' }, 400);
  }

  const { email: rawEmail, ref } = body;

  const { valid, error: validationError } = validateEmail(rawEmail);
  if (!valid) {
    return jsonResponse({ ok: false, error: validationError }, 422);
  }

  const email = rawEmail.trim().toLowerCase();

  // Check if KV is configured
  if (!env.SUBSCRIBERS_KV) {
    console.error('[subscribe] SUBSCRIBERS_KV binding not configured');
    // Fallback: log and accept
    console.log(`[subscribe] New: ${email} (ref: ${ref || '/'})`);
    return jsonResponse({ ok: true, message: 'Subscribed! (KV not configured — check dashboard)' });
  }

  // Check if already subscribed
  const existing = await env.SUBSCRIBERS_KV.get(`sub:${email}`, { type: 'json' }).catch(() => null);
  if (existing) {
    const sub = existing as any;
    if (sub.confirmed) {
      return jsonResponse({ ok: true, message: 'You\'re already subscribed!' });
    }
    // Not yet confirmed — resend confirmation
    const token = generateToken();
    await env.SUBSCRIBERS_KV.put(`token:${token}`, email, { expirationTtl: 86400 }); // 24hr
    await sendConfirmationEmail(email, token, env);
    return jsonResponse({ ok: true, message: 'Confirmation email resent! Check your inbox.' });
  }

  // New subscriber — create pending entry
  const token = generateToken();
  await env.SUBSCRIBERS_KV.put(`sub:${email}`, JSON.stringify({
    email,
    ref: ref || '/',
    subscribedAt: new Date().toISOString(),
    confirmed: false,
  }));
  // Token → email mapping, expires in 24 hours
  await env.SUBSCRIBERS_KV.put(`token:${token}`, email, { expirationTtl: 86400 });

  // Send confirmation email
  const sent = await sendConfirmationEmail(email, token, env);
  if (!sent) {
    return jsonResponse({
      ok: true,
      message: 'Subscribed! We\'ll activate your subscription shortly.',
    });
  }

  return jsonResponse({
    ok: true,
    message: 'Check your inbox to confirm your subscription!',
  });
};

// CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
