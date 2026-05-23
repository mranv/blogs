// Cloudflare Pages Function — /api/unsubscribe
// One-click unsubscribe (CAN-SPAM / GDPR compliant)
// List-Unsubscribe header is handled by the email Worker

import { unsubscribedPage } from '../_lib/email-templates';

interface Env {
  SUBSCRIBERS_KV?: KVNamespace;
  SITE_URL?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const env = context.env;
  const url = new URL(context.request.url);
  const email = url.searchParams.get('email');
  const siteUrl = env.SITE_URL || 'https://mranv.pages.dev';

  if (!email) {
    return new Response('Missing email parameter.', { status: 400 });
  }

  if (!env.SUBSCRIBERS_KV) {
    return new Response('Subscription system not configured.', { status: 500 });
  }

  // Remove all subscriber data
  await env.SUBSCRIBERS_KV.delete(`sub:${email}`);
  await env.SUBSCRIBERS_KV.delete(`confirmed:${email}`);

  return new Response(unsubscribedPage(siteUrl, email), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
};
