// Cloudflare Pages Function — /api/admin/broadcast
// Admin-only: Send branded newsletter to all confirmed subscribers
// Protected by ADMIN_SECRET env var

import { broadcastEmail } from '../_lib/email-templates';

interface Env {
  SUBSCRIBERS_KV?: KVNamespace;
  EMAIL_WORKER_URL?: string;
  EMAIL_WORKER_SECRET?: string;
  ADMIN_SECRET?: string;
}

interface BroadcastRequest {
  subject: string;
  htmlBody?: string;
  textBody?: string;
  postUrl?: string;
  postTitle?: string;
  postExcerpt?: string;
}

async function sendViaWorker(env: Env, to: string, subject: string, html: string, text: string): Promise<boolean> {
  const workerUrl = env.EMAIL_WORKER_URL;
  const secret = env.EMAIL_WORKER_SECRET;
  if (!workerUrl || !secret) return false;
  try {
    const res = await fetch(`${workerUrl}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${secret}` },
      body: JSON.stringify({
        to: [{ email: to }],
        from: { email: 'newsletter@techanv.com' },
        subject,
        html,
        text,
      }),
    });
    const data = await res.json() as any;
    return data.ok === true;
  } catch (err) {
    console.error(`[broadcast] Failed for ${to}:`, err);
    return false;
  }
}

function json(data: object, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── POST: Send broadcast ────────────────────────────────────────
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const env = context.env;
  const url = new URL(context.request.url);

  // Verify admin secret
  const secret = url.searchParams.get('secret');
  if (!secret || secret !== env.ADMIN_SECRET) {
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

  // Send to each subscriber (with personal unsubscribe link)
  let sent = 0;
  let failed = 0;
  for (const email of confirmed) {
    const tpl = broadcastEmail(
      email,
      body.subject,
      body.htmlBody || '',
      body.textBody || '',
      body.postTitle,
      body.postUrl,
      body.postExcerpt,
    );
    const ok = await sendViaWorker(env, email, tpl.subject, tpl.html, tpl.text);
    if (ok) sent++;
    else failed++;
  }

  return json({ ok: true, sent, failed, total: confirmed.length });
};

// ── GET: Subscriber stats ───────────────────────────────────────
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const env = context.env as Record<string, any>;
  const url = new URL(context.request.url);
  const secret = url.searchParams.get('secret');
  if (!secret || !env.ADMIN_SECRET || secret !== env.ADMIN_SECRET) {
    return json({ ok: false, error: 'Unauthorized' }, 401);
  }

  if (!env.SUBSCRIBERS_KV) {
    return json({ ok: false, error: 'KV not configured' }, 500);
  }

  const kv = env.SUBSCRIBERS_KV as KVNamespace;

  // Count confirmed subscribers
  let confirmed = 0;
  let pending = 0;
  let cursor: string | undefined;
  do {
    const list = await kv.list({ prefix: 'confirmed:', cursor, limit: 100 });
    confirmed += list.keys.length;
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);

  cursor = undefined;
  do {
    const list = await kv.list({ prefix: 'sub:', cursor, limit: 100 });
    for (const key of list.keys) {
      const data = await kv.get(key.name, { type: 'json' }) as any;
      if (data && !data.confirmed) pending++;
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);

  return json({ ok: true, confirmed, pending });
};
