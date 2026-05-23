// Cloudflare Pages Function — /api/confirm
// Double opt-in: verifies token, marks subscriber as confirmed

interface Env {
  SUBSCRIBERS_KV?: KVNamespace;
  SITE_URL?: string;
  SITE_NAME?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const env = context.env;
  const url = new URL(context.request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response('Missing confirmation token.', { status: 400 });
  }

  if (!env.SUBSCRIBERS_KV) {
    return new Response('Subscription system not configured.', { status: 500 });
  }

  // Look up token → email
  const email = await env.SUBSCRIBERS_KV.get(`token:${token}`);
  if (!email) {
    const siteUrl = env.SITE_URL || 'https://mranv.pages.dev';
    return new Response(`
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Link Expired</title>
<style>
  body{margin:0;padding:0;background:#0d111b;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:-apple-system,sans-serif;color:#e6edf3}
  .card{background:#161b22;border:1px solid #30363d;border-radius:16px;padding:40px;max-width:480px;text-align:center}
  h1{font-size:24px;margin:0 0 12px}
  p{color:#8b949e;font-size:15px;line-height:1.6;margin:0 0 20px}
  a{color:#6366f1;text-decoration:none}
</style></head><body>
<div class="card">
  <h1>⏰ Link Expired</h1>
  <p>This confirmation link has expired (valid for 24 hours). Please subscribe again to get a new link.</p>
  <a href="${siteUrl}">← Back to blog</a>
</div>
</body></html>`, {
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

  // Add to confirmed list (for fast broadcasting)
  await env.SUBSCRIBERS_KV.put(`confirmed:${email}`, JSON.stringify({
    email,
    confirmedAt: sub.confirmedAt,
    ref: sub.ref,
  }));

  const siteUrl = env.SITE_URL || 'https://mranv.pages.dev';
  const siteName = env.SITE_NAME || "Anubhav Gain's Blog";

  return new Response(`
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Subscribed!</title>
<style>
  body{margin:0;padding:0;background:#0d111b;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:-apple-system,sans-serif;color:#e6edf3}
  .card{background:#161b22;border:1px solid #30363d;border-radius:16px;padding:40px;max-width:480px;text-align:center}
  h1{font-size:24px;margin:0 0 12px}
  p{color:#8b949e;font-size:15px;line-height:1.6;margin:0 0 20px}
  a{display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:8px;font-weight:600}
</style></head><body>
<div class="card">
  <h1>🎉 You're subscribed!</h1>
  <p>You'll now receive updates about new posts from <strong>${siteName}</strong>.</p>
  <a href="${siteUrl}">Start Reading →</a>
</div>
</body></html>`, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
};
