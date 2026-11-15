// Cloudflare Pages Function — POST /api/visitors
// Live visitor dots for the home hero globe (src/components/fx/Globe.tsx).
//
// Each open home page POSTs here once a minute. The handler records the caller's coarse
// location and returns every location seen in the last EXPIRE_S seconds as [[lat, lon], ...].
//
// Invariants:
// - The location comes from Cloudflare's own geolocation (request.cf), never from the
//   request body, so a caller cannot plant arbitrary dots.
// - Privacy: coordinates are rounded to whole degrees (~110 km) and no IP, cookie or id
//   is stored. Documented in src/content/spec/privacy.md; keep the two in sync.
// - KV free-tier budget: everything lives in ONE key and is only rewritten when the
//   caller's entry is missing or older than REFRESH_S, so a hammering client costs reads
//   (100k/day) and at most one write per REFRESH_S per location (writes: 1k/day).
//
// ponytail: read-modify-write on one KV key, so two simultaneous writers can drop a dot
// until its next refresh. Fine for decoration; move to a Durable Object (websocket, like
// lilnasy/multiplayer-globe) if exact real-time presence ever matters.

interface Env {
  SUBSCRIBERS_KV?: KVNamespace;
}

// Storage format: JSON object { "<lat>,<lon>": <unix seconds last seen> }, whole degrees.
const KEY = 'globe:visitors';
const REFRESH_S = 150; // rewrite own entry when older than this
const EXPIRE_S = 300; // entries older than this are dropped / not returned
const MAX_DOTS = 200;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const json = (dots: number[][]) =>
    new Response(JSON.stringify(dots), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  const kv = env.SUBSCRIBERS_KV;
  if (!kv) return json([]);

  const now = Math.floor(Date.now() / 1000);
  const seen: Record<string, number> = (await kv.get(KEY, { type: 'json' }).catch(() => null)) || {};
  for (const k of Object.keys(seen)) if (now - seen[k] > EXPIRE_S) delete seen[k];

  const cf = (request as Request & { cf?: { latitude?: string; longitude?: string } }).cf;
  const lat = Math.round(Number(cf?.latitude));
  const lon = Math.round(Number(cf?.longitude));
  // cf is absent in local dev and for some requests; then just report, don't record
  if (cf?.latitude && cf?.longitude && Number.isFinite(lat) && Number.isFinite(lon)) {
    const me = `${lat},${lon}`;
    const stale = !(me in seen) || now - seen[me] > REFRESH_S;
    seen[me] = now;
    if (stale && Object.keys(seen).length <= MAX_DOTS) {
      // KV's minimum TTL is 60 s; the key expires on its own once nobody refreshes it
      await kv.put(KEY, JSON.stringify(seen), { expirationTtl: EXPIRE_S }).catch(() => {});
    }
  }
  return json(Object.keys(seen).slice(0, MAX_DOTS).map((k) => k.split(',').map(Number)));
};
