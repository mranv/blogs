// Cloudflare Pages Function — /api/admin/broadcast
// Admin-only: Send branded newsletter to all confirmed subscribers
// Protected by ADMIN_SECRET via Authorization header

import { sendEmail, timingSafeCompare, unsubscribeUrl } from '../../_lib/email';
import { broadcastEmail } from '../../_lib/email-templates';

interface Env {
  SUBSCRIBERS_KV?: KVNamespace;
  EMAIL_WORKER_URL?: string;
  EMAIL_WORKER_SECRET?: string;
  ADMIN_SECRET?: string;
  SITE_URL?: string;
}

interface BroadcastRequest {
  subject: string;
  htmlBody?: string;
  textBody?: string;
  postUrl?: string;
  postTitle?: string;
  postExcerpt?: string;
}

function json(data: object, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Header only: a ?secret= query param would leak the secret into logs and browser history.
function getAdminSecret(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
}

function verifySecret(request: Request, env: Env): boolean {
  const secret = getAdminSecret(request);
  if (!secret || !env.ADMIN_SECRET) return false;
  return timingSafeCompare(secret, env.ADMIN_SECRET);
}

// ── POST: Send broadcast ────────────────────────────────────────
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const env = context.env;

  if (!verifySecret(context.request, env)) {
    return json({ ok: false, error: 'Unauthorized' }, 401);
  }

  if (!env.SUBSCRIBERS_KV) {
    return json({ ok: false, error: 'KV not configured' }, 500);
  }

  let body: BroadcastRequest;
  try {
    body = await context.request.json();
  } catch {
    return json({ ok: false, error: 'Invalid body' }, 400);
  }

  if (!body.subject || (!body.htmlBody && !body.postUrl)) {
    return json({ ok: false, error: 'Missing subject or content' }, 400);
  }

  // List all confirmed subscribers
  const confirmed: string[] = [];
  let cursor: string | undefined;
  do {
    const list = await env.SUBSCRIBERS_KV.list({ prefix: 'confirmed:', cursor, limit: 100 });
    for (const key of list.keys) {
      if (key.name.startsWith('confirmed:')) {
        confirmed.push(key.name.replace('confirmed:', ''));
      }
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);

  if (confirmed.length === 0) {
    return json({ ok: true, sent: 0, message: 'No confirmed subscribers.' });
  }

  const siteUrl = env.SITE_URL || 'https://mranv.pages.dev';

  // Batch send with bounded concurrency (chunks of 10) to avoid timeouts
  const BATCH_SIZE = 10;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < confirmed.length; i += BATCH_SIZE) {
    const batch = confirmed.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (email) => {
        const tpl = broadcastEmail(
          await unsubscribeUrl(siteUrl, email, env.EMAIL_WORKER_SECRET || ''),
          body.subject,
          body.htmlBody || '',
          body.textBody || '',
          body.postTitle,
          body.postUrl,
          body.postExcerpt,
        );
        const result = await sendEmail({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text }, env);
        return result.ok;
      })
    );
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) sent++;
      else failed++;
    }
  }

  return json({ ok: true, sent, failed, total: confirmed.length });
};

// ── GET: Subscriber stats ───────────────────────────────────────
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const env = context.env;

  if (!verifySecret(context.request, env)) {
    return json({ ok: false, error: 'Unauthorized' }, 401);
  }

  if (!env.SUBSCRIBERS_KV) {
    return json({ ok: false, error: 'KV not configured' }, 500);
  }

  const kv = env.SUBSCRIBERS_KV;

  let confirmed = 0;
  let pending = 0;
  let cursor: string | undefined;
  do {
    const list = await kv.list({ prefix: 'confirmed:', cursor, limit: 100 });
    confirmed += list.keys.length;
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);

  // Every confirmed:<email> also has a sub:<email>, so pending = sub count - confirmed count.
  // Counting keys avoids one KV read per subscriber.
  let total = 0;
  cursor = undefined;
  do {
    const list = await kv.list({ prefix: 'sub:', cursor, limit: 1000 });
    total += list.keys.length;
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);
  pending = Math.max(0, total - confirmed);

  return json({ ok: true, confirmed, pending });
};
