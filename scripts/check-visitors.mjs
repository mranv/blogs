// Self-check for functions/api/visitors.ts (no wrangler needed): node scripts/check-visitors.mjs
// Runs the handler against an in-memory KV with faked Cloudflare geolocation.
import assert from "node:assert/strict";
import { onRequestPost } from "../functions/api/visitors.ts";

const store = new Map();
let puts = 0;
const kv = {
	get: async (k) => (store.has(k) ? JSON.parse(store.get(k)) : null),
	put: async (k, v) => { puts++; store.set(k, v); },
};
const hit = async (latitude, longitude) => {
	const request = Object.assign(new Request("http://x/api/visitors", { method: "POST" }), { cf: latitude && { latitude, longitude } });
	return (await onRequestPost({ request, env: { SUBSCRIBERS_KV: kv } })).json();
};

assert.deepEqual(await hit("23.03", "72.58"), [[23, 73]], "records the caller, rounded to whole degrees");
assert.deepEqual(await hit("23.4", "72.6"), [[23, 73]], "same cell is one dot");
assert.equal(puts, 1, "a fresh entry is not rewritten (write budget)");
assert.deepEqual(await hit("-33.9", "151.2"), [[23, 73], [-34, 151]], "second location adds a dot");
assert.deepEqual(await hit(undefined), [[23, 73], [-34, 151]], "no geolocation: report only");
store.set("globe:visitors", JSON.stringify({ "10,10": Math.floor(Date.now() / 1000) - 301 }));
assert.deepEqual(await hit(undefined), [], "entries older than 5 minutes are dropped");
assert.deepEqual(await (await onRequestPost({ request: new Request("http://x"), env: {} })).json(), [], "no KV binding: empty list, no crash");
console.log("visitors ok");
