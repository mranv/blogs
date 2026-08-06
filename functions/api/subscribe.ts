// Cloudflare Pages Function — /api/subscribe
// Double opt-in with branded TechAnV email templates
// Fully Cloudflare-native: KV + email-sender Worker + send_email

import { sendEmail } from '../_lib/email';
import { confirmEmail } from '../_lib/email-templates';

interface Env {
  SUBSCRIBERS_KV?: KVNamespace;
  EMAIL_WORKER_URL?: string;
  EMAIL_WORKER_SECRET?: string;
}

interface SubscribeRequest {
  email: string;
  ref?: string;
}

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', 'throwaway.email', 'guerrillamail.com',
  'mailinator.com', 'yopmail.com', 'sharklasers.com',
  'guerrillamailblock.com', 'grr.la', 'dispostable.com',
  'maildrop.cc', 'mailnesia.com', 'trashmail.com',
]);

function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') return { valid: false, error: 'Email address is required.' };
  const trimmed = email.trim();
  if (!trimmed) return { valid: false, error: 'Email address is required.' };
  if (trimmed.length > 254) return { valid: false, error: 'Email address is too long.' };
  if (!EMAIL_REGEX.test(trimmed)) return { valid: false, error: 'Please enter a valid email address.' };
  const domain = trimmed.split('@')[1]?.toLowerCase();
  if (domain && DISPOSABLE_DOMAINS.has(domain)) return { valid: false, error: 'Please use a permanent email address.' };
  return { valid: true };
}

function json(data: object, status = 200): Response {
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

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const env = context.env;

    let body: SubscribeRequest;
    try {
      body = await context.request.json();
    } catch {
      return json({ ok: false, error: 'Invalid request body.' }, 400);
    }

    const { valid, error } = validateEmail(body.email);
    if (!valid) return json({ ok: false, error }, 422);

    const email = body.email.trim().toLowerCase();
    const ref = body.ref || '/';

    if (!env.SUBSCRIBERS_KV) {
      console.error('[subscribe] SUBSCRIBERS_KV not configured');
      return json({ ok: false, error: 'Subscription system unavailable.' }, 503);
    }

    // Check existing subscriber
    const existing = await env.SUBSCRIBERS_KV.get(`sub:${email}`, { type: 'json' }).catch(() => null);
    if (existing) {
      const sub = existing as any;
      if (sub.confirmed) {
        return json({ ok: true, message: "You're already subscribed!" });
      }
      // Resend confirmation
      const token = generateToken();
      await env.SUBSCRIBERS_KV.put(`token:${token}`, email, { expirationTtl: 86400 }).catch((e) => {
        console.error('[subscribe] KV put token error:', e);
      });
      const tpl = confirmEmail(email, token);
      await sendEmail({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text }, env);
      return json({ ok: true, message: 'Confirmation email resent! Check your inbox.' });
    }

    // New subscriber
    const token = generateToken();
    await env.SUBSCRIBERS_KV.put(`sub:${email}`, JSON.stringify({
      email,
      ref,
      subscribedAt: new Date().toISOString(),
      confirmed: false,
    })).catch((e) => {
      console.error('[subscribe] KV put sub error:', e);
      throw e;
    });
    await env.SUBSCRIBERS_KV.put(`token:${token}`, email, { expirationTtl: 86400 }).catch((e) => {
      console.error('[subscribe] KV put token error:', e);
    });

    const tpl = confirmEmail(email, token);
    const result = await sendEmail({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text }, env);

    if (!result.ok) {
      return json({ ok: true, message: "Subscribed! We'll send your confirmation shortly." });
    }
    return json({ ok: true, message: 'Check your inbox to confirm your subscription!' });
  } catch (err) {
    console.error('[subscribe] Unhandled error:', err);
    return json({ ok: false, error: 'Service temporarily unavailable. Please try again.' }, 503);
  }
};

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
