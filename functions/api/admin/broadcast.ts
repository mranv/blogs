// Cloudflare Pages Function — /api/admin/broadcast
// Admin-only: Send branded newsletter to all confirmed subscribers
// Protected by ADMIN_SECRET via Authorization header

import { sendEmail } from '../../_lib/email';
import { broadcastEmail } from '../../_lib/email-templates';

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

function json(data: object, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Constant-time string comparison to prevent timing attacks
function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Extract admin secret from Authorization header (preferred) or query param (fallback)
function getAdminSecret(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const url = new URL(request.url);
  return url.searchParams.get('secret');
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

  // Batch send with bounded concurrency (chunks of 10) to avoid timeouts
  const BATCH_SIZE = 10;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < confirmed.length; i += BATCH_SIZE) {
    const batch = confirmed.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (email) => {
        const tpl = broadcastEmail(
          email,
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
