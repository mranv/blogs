// Cloudflare Pages Function — /api/admin/broadcast
// Admin-only: Send newsletter to all confirmed subscribers via send_email binding
// Protected by ADMIN_SECRET env var

interface Env {
  SUBSCRIBERS_KV: KVNamespace;
  SEND_EMAIL: { send: (msg: any) => Promise<void> };
  ADMIN_EMAIL: string;
  SITE_NAME: string;
  SITE_URL: string;
  ADMIN_SECRET: string;
}

interface BroadcastRequest {
  subject: string;
  htmlBody?: string;
  textBody?: string;
  postUrl?: string;
  postTitle?: string;
}

function wrapInTemplate(content: string, env: Env, email: string): { html: string; text: string } {
  const siteUrl = env.SITE_URL || 'https://mranv.pages.dev';
  const siteName = env.SITE_NAME || "Anubhav Gain's Blog";
  const unsubUrl = `${siteUrl}/api/unsubscribe?email=${encodeURIComponent(email)}`;

  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d111b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#161b22;border-radius:16px;border:1px solid #30363d;">
    <tr>
      <td style="padding:40px 32px;">
        ${content}
        <hr style="border:none;border-top:1px solid #30363d;margin:24px 0;">
        <p style="margin:0;color:#484f58;font-size:12px;">
          You're receiving this because you subscribed to ${siteName}.<br>
          <a href="${unsubUrl}" style="color:#6366f1;">Unsubscribe</a> ·
          <a href="${siteUrl}" style="color:#6366f1;">View on web</a>
        </p>
      </td>
    </tr>
  </table>
</body></html>`;

  // Strip HTML for plain text version
  const text = content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() +
    `\n\nUnsubscribe: ${unsubUrl}\nView on web: ${siteUrl}`;

  return { html, text };
}

async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  textBody: string,
  env: Env
): Promise<boolean> {
  try {
    await env.SEND_EMAIL.send({
      from: `newsletter@techanv.com`,
      to,
      subject,
      html: htmlBody,
      text: textBody,
    });
    return true;
  } catch (err) {
    console.error(`[broadcast] Failed for ${to}:`, err);
    return false;
  }
}

// ── POST: Send broadcast ────────────────────────────────────────
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const env = context.env;

  // Verify admin secret
  const secret = context.url.searchParams.get('secret');
  if (!secret || secret !== env.ADMIN_SECRET) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!env.SUBSCRIBERS_KV) {
    return new Response(JSON.stringify({ ok: false, error: 'KV not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: BroadcastRequest;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.subject || (!body.htmlBody && !body.postUrl)) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing subject or content' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // If it's a new post notification, build the email
  let htmlContent = body.htmlBody || '';
  let textContent = body.textBody || '';

  if (body.postUrl && body.postTitle) {
    htmlContent = `
      <h1 style="margin:0 0 8px;color:#e6edf3;font-size:24px;">📝 New Post Published</h1>
      <h2 style="margin:0 0 16px;color:#6366f1;font-size:20px;">${body.postTitle}</h2>
      <p style="margin:0 0 24px;color:#8b949e;font-size:15px;line-height:1.6;">
        A new article has been published on ${env.SITE_NAME || 'the blog'}.
        Click below to read it.
      </p>
      <a href="${body.postUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;">
        Read Article →
      </a>`;
    textContent = `New Post: ${body.postTitle}\n\nRead it here: ${body.postUrl}`;
  }

  // List all confirmed subscribers from KV
  const confirmed: string[] = [];
  let cursor: string | null = null;
  do {
    const list = await env.SUBSCRIBERS_KV.list({ prefix: 'confirmed:', cursor });
    for (const key of list.keys) {
      confirmed.push(key.name.replace('confirmed:', ''));
    }
    cursor = list.list_complete ? null : list.cursor;
  } while (cursor);

  if (confirmed.length === 0) {
    return new Response(JSON.stringify({ ok: true, message: 'No confirmed subscribers', sent: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Send emails in batches of 5
  let sent = 0;
  let failed = 0;
  const batchSize = 5;

  for (let i = 0; i < confirmed.length; i += batchSize) {
    const batch = confirmed.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((email) => {
        const { html, text } = wrapInTemplate(htmlContent, env, email);
        return sendEmail(email, body.subject, html, text, env);
      })
    );
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) sent++;
      else failed++;
    }
    if (i + batchSize < confirmed.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    sent,
    failed,
    total: confirmed.length,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// ── GET: Subscriber stats ───────────────────────────────────────
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const env = context.env;
  const secret = context.url.searchParams.get('secret');
  if (!secret || secret !== env.ADMIN_SECRET) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!env.SUBSCRIBERS_KV) {
    return new Response(JSON.stringify({ error: 'KV not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const confirmed: string[] = [];
  const pending: string[] = [];
  let cursor: string | null = null;

  do {
    const list = await env.SUBSCRIBERS_KV.list({ prefix: 'sub:', cursor });
    for (const key of list.keys) {
      const data = await env.SUBSCRIBERS_KV.get(key.name, { type: 'json' }) as any;
      const email = key.name.replace('sub:', '');
      if (data?.confirmed) confirmed.push(email);
      else pending.push(email);
    }
    cursor = list.list_complete ? null : list.cursor;
  } while (cursor);

  return new Response(JSON.stringify({
    confirmed: confirmed.length,
    pending: pending.length,
    total: confirmed.length + pending.length,
    emails: { confirmed, pending },
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
