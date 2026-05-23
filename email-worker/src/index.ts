// email-sender Worker
// Dedicated Cloudflare Worker with send_email binding.
// Called by Pages Functions (subscribe, broadcast) to send emails.
//
// API:
//   POST /send
//   Headers: Authorization: Bearer <EMAIL_WORKER_SECRET>
//   Body: { to: [{email, name?}], from: {email, name}, subject, html?, text? }
//   Response: { ok: true } or { ok: false, error: string }

interface EmailRequest {
  to: Array<{ email: string; name?: string }>;
  from: { email: string; name: string };
  subject: string;
  html?: string;
  text?: string;
}

interface Env {
  SEND_EMAIL: {
    send: (msg: any) => Promise<void>;
  };
  EMAIL_WORKER_SECRET: string;
}

function json(data: object, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Only POST /send is allowed
    if (request.method !== 'POST') {
      return json({ ok: false, error: 'Method not allowed.' }, 405);
    }

    const url = new URL(request.url);
    if (url.pathname !== '/send') {
      return json({ ok: false, error: 'Not found.' }, 404);
    }

    // Auth check
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || token !== env.EMAIL_WORKER_SECRET) {
      return json({ ok: false, error: 'Unauthorized.' }, 401);
    }

    // Parse body
    let body: EmailRequest;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: 'Invalid JSON body.' }, 400);
    }

    // Validate required fields
    if (!body.to || !Array.isArray(body.to) || body.to.length === 0) {
      return json({ ok: false, error: 'Missing or invalid "to" field.' }, 400);
    }
    if (!body.from || !body.from.email) {
      return json({ ok: false, error: 'Missing or invalid "from" field.' }, 400);
    }
    if (!body.subject) {
      return json({ ok: false, error: 'Missing "subject" field.' }, 400);
    }

    // Send email via Cloudflare Email Service
    try {
      const message: any = {
        from: body.from,
        to: body.to,
        subject: body.subject,
      };
      if (body.html) message.html = body.html;
      if (body.text) message.text = body.text;

      await env.SEND_EMAIL.send(message);

      return json({ ok: true });
    } catch (err: any) {
      console.error('[email-sender] send_email error:', err);
      return json({ ok: false, error: err?.message || 'Failed to send email.' }, 500);
    }
  },
};
