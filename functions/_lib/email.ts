// Shared email utility for Pages Functions
// Calls the dedicated email-sender Worker via fetch()
//
// The Worker URL and secret are passed via env vars on the Pages project:
//   EMAIL_WORKER_URL  — e.g. https://email-sender.<account>.workers.dev
//   EMAIL_WORKER_SECRET — shared auth key

interface EmailParams {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

interface EmailEnv {
  EMAIL_WORKER_URL?: string;
  EMAIL_WORKER_SECRET?: string;
}

export async function sendEmail(
  params: EmailParams,
  env: EmailEnv
): Promise<{ ok: boolean; error?: string }> {
  const workerUrl = env.EMAIL_WORKER_URL;
  const secret = env.EMAIL_WORKER_SECRET;

  if (!workerUrl || !secret) {
    console.warn('[sendEmail] EMAIL_WORKER_URL or EMAIL_WORKER_SECRET not configured');
    return { ok: false, error: 'Email worker not configured.' };
  }

  try {
    const res = await fetch(`${workerUrl}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`,
      },
      body: JSON.stringify({
        to: [{ email: params.to }],
        from: { email: 'newsletter@techanv.com', name: "Anubhav Gain's Blog" },
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    const data = await res.json() as any;
    return { ok: data.ok, error: data.error };
  } catch (err: any) {
    console.error('[sendEmail] fetch error:', err);
    return { ok: false, error: err?.message || 'Network error calling email worker.' };
  }
}

// Unsubscribe links are signed so nobody can unsubscribe an address they don't own.
// Format: <site>/api/unsubscribe?email=<urlencoded email>&sig=<hex HMAC-SHA256(EMAIL_WORKER_SECRET, email)>
// The email is lowercased before signing. Rotating EMAIL_WORKER_SECRET invalidates every link already sent.
export async function signEmail(email: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(email.toLowerCase()));
  return Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function unsubscribeUrl(siteUrl: string, email: string, secret: string): Promise<string> {
  return `${siteUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&sig=${await signEmail(email, secret)}`;
}

// Constant-time comparison so response timing doesn't leak how much of a secret matched.
export function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}
