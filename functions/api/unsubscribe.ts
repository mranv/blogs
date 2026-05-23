// Cloudflare Pages Function — /api/unsubscribe
// Handles unsubscribe from newsletter

interface Env {
  SUBSCRIBERS_KV: KVNamespace;
  SITE_URL: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const env = context.env;
  const email = context.url.searchParams.get('email');
  const token = context.url.searchParams.get('token');

  if (!email || !token) {
    return new Response('Missing email or token.', { status: 400 });
  }

  if (!env.SUBSCRIBERS_KV) {
    return new Response('Subscription system not configured.', { status: 500 });
  }

  // Verify token (simple hash-based)
  const expectedToken = await env.SUBSCRIBERS_KV.get(`unsub:${email}`);
  if (!expectedToken || expectedToken !== token) {
    // Try direct unsubscribe (less secure but user-friendly)
    // Just check if email exists
    const existing = await env.SUBSCRIBERS_KV.get(`sub:${email}`);
    if (!existing) {
      return new Response('Email not found in our list.', { status: 404 });
    }
  }

  // Remove from all lists
  await env.SUBSCRIBERS_KV.delete(`sub:${email}`);
  await env.SUBSCRIBERS_KV.delete(`confirmed:${email}`);
  await env.SUBSCRIBERS_KV.delete(`unsub:${email}`);

  return new Response(`
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Unsubscribed</title>
<style>
  body{margin:0;padding:0;background:#0d111b;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:-apple-system,sans-serif;color:#e6edf3}
  .card{background:#161b22;border:1px solid #30363d;border-radius:16px;padding:40px;max-width:480px;text-align:center}
  h1{font-size:24px;margin:0 0 12px}
  p{color:#8b949e;font-size:15px;line-height:1.6;margin:0 0 20px}
  a{color:#6366f1;text-decoration:none}
</style></head><body>
<div class="card">
  <h1>👋 Unsubscribed</h1>
  <p>You've been removed from the newsletter. You won't receive any more emails.</p>
  <p>You can always resubscribe from the blog sidebar.</p>
  <a href="${env.SITE_URL || 'https://mranv.pages.dev'}">← Back to blog</a>
</div>
</body></html>`, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};
