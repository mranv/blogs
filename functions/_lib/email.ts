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
