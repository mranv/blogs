// Cloudflare Pages Function — /api/confirm
// Double opt-in: verifies token, marks subscriber as confirmed, sends welcome email

import { sendEmail } from '../_lib/email';
import { tokenExpiredPage, confirmSuccessPage, welcomeEmail } from '../_lib/email-templates';

interface Env {
  SUBSCRIBERS_KV?: KVNamespace;
  EMAIL_WORKER_URL?: string;
  EMAIL_WORKER_SECRET?: string;
  SITE_URL?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const env = context.env;
  const url = new URL(context.request.url);
  const token = url.searchParams.get('token');
  const siteUrl = env.SITE_URL || 'https://mranv.pages.dev';

  if (!token) {
    return new Response('Missing confirmation token.', { status: 400 });
  }

  if (!env.SUBSCRIBERS_KV) {
    return new Response('Subscription system not configured.', { status: 500 });
  }

  // Look up token → email
  const email = await env.SUBSCRIBERS_KV.get(`token:${token}`);
  if (!email) {
    return new Response(tokenExpiredPage(siteUrl), {
      status: 410,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Mark subscriber as confirmed
  const existing = await env.SUBSCRIBERS_KV.get(`sub:${email}`, { type: 'json' });
  if (!existing) {
    return new Response('Subscriber record not found.', { status: 404 });
  }

  const sub = existing as any;
  sub.confirmed = true;
  sub.confirmedAt = new Date().toISOString();

  await env.SUBSCRIBERS_KV.put(`sub:${email}`, JSON.stringify(sub));
  await env.SUBSCRIBERS_KV.delete(`token:${token}`);

  // Add to confirmed set (for fast broadcasting)
  await env.SUBSCRIBERS_KV.put(`confirmed:${email}`, JSON.stringify({
    email,
    confirmedAt: sub.confirmedAt,
    ref: sub.ref,
  }));

  // Send welcome email (fire-and-forget, don't block the page)
  const welcome = welcomeEmail(email);
  context.waitUntil(sendEmail({ to: email, subject: welcome.subject, html: welcome.html, text: welcome.text }, env));

  return new Response(confirmSuccessPage(siteUrl), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
};
