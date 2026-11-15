// SEO audit over a built dist/: titles, descriptions, canonicals, h1 count, og:image and
// internal links that resolve, JSON-LD that parses, sitemap coverage, HTML under 2 MB.
// Runs at the end of `pnpm build` (package.json), so a hard failure also fails the Cloudflare
// Pages deploy. By hand: node scripts/seo-audit.mjs [dist] [https://mranv.pages.dev]
// N=300 prints up to 300 examples per finding (default 6). Read-only; exits 1 on a hard
// failure (og:image 404, invalid JSON-LD, sitemap URL 404, post without Article schema).
// Regex-based on purpose: no HTML parser dependency. See docs/SEO.md.
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
const [DIST, ORIGIN] = [process.argv[2] || "dist", (process.argv[3] || "https://mranv.pages.dev").replace(/\/$/, "")];
const pages = [];
(function walk(d) {
	for (const f of readdirSync(d)) {
		const p = join(d, f);
		if (statSync(p).isDirectory()) { if (!["_astro", "pagefind"].includes(f)) walk(p); }
		else if (f.endsWith(".html")) pages.push(p);
	}
})(DIST);
const attr = (tag, name) => dec((tag.match(new RegExp(`${name}="([^"]*)"`, "i")) || [])[1]);
const meta = (html, key) => {
	// content is matched up to its closing quote: a description may contain a literal ">".
	const m = html.match(new RegExp(`<meta[^>]*(?:name|property)="${key}"[^>]*?content="([^"]*)"`, "i"));
	return m ? dec(m[1]) : undefined;
};
// Astro escapes & as &#38; in attributes and the sitemap uses &amp;: decode before comparing.
const dec = (s) => s?.replace(/&amp;|&#38;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
const issues = {};
const add = (k, url) => (issues[k] ||= []).push(url);
const titles = new Map(), descs = new Map(), types = {};
const exists = (path) => {
	const p = join(DIST, decodeURIComponent(path.split(/[?#]/)[0]));
	return existsSync(p) && (statSync(p).isFile() || existsSync(join(p, "index.html")));
};
const brokenLinks = new Map();
for (const file of pages) {
	const html = readFileSync(file, "utf8");
	if (!html.includes("</head>")) continue; // bare files such as the Google verification page
	const rel = "/" + relative(DIST, file).replace(/index\.html$/, "");
	const url = ORIGIN + rel;
	const head = html.slice(0, html.indexOf("</head>"));
	const robots = meta(head, "robots") || "";
	if (/noindex/.test(robots)) { add("noindex", rel); continue; }
	if (Buffer.byteLength(html) > 2e6) add("html>2MB", rel);
	const title = dec((head.match(/<title>([^<]*)<\/title>/) || [])[1]);
	if (!title) add("title missing", rel);
	else { if (title.length > 65) add("title >65 chars", rel); if (title.length < 20) add("title <20 chars", rel); (titles.get(title) || titles.set(title, []).get(title)).push(rel); }
	const d = dec(meta(head, "description"));
	if (!d) add("description missing", rel);
	else { if (d.length > 165) add("description >165", rel); if (d.length < 70) add("description <70", rel); (descs.get(d) || descs.set(d, []).get(d)).push(rel); }
	const canon = (head.match(/<link[^>]*rel="canonical"[^>]*>/) || [])[0];
	const ch = canon && attr(canon, "href");
	if (!ch) add("canonical missing", rel); else if (decodeURI(ch) !== url && rel !== "/404.html") add("canonical not self", `${rel} -> ${ch}`);
	const h1 = (html.match(/<h1[\s>]/g) || []).length;
	if (h1 !== 1) add(`h1 count ${h1 > 1 ? ">1" : "0"}`, rel);
	const og = meta(head, "og:image");
	if (!og) add("og:image missing", rel);
	else if (og.startsWith(ORIGIN) && !exists(og.slice(ORIGIN.length))) add("og:image 404", `${rel} -> ${og}`);
	for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
		try {
			const j = JSON.parse(m[1]);
			for (const n of [].concat(j["@graph"] || j)) {
				const t = [].concat(n["@type"]).join(",");
				types[t] = (types[t] || 0) + 1;
				if (/BlogPosting|Article/.test(t)) for (const f of ["headline", "datePublished", "author", "image"]) if (!n[f]) add(`BlogPosting missing ${f}`, rel);
			}
		} catch { add("JSON-LD invalid", rel); }
	}
	if (rel.startsWith("/posts/") && !/BlogPosting|"Article"|TechArticle/.test(html)) add("post without Article schema", rel);
	const imgs = html.match(/<img\b[^>]*>/g) || [];
	const noAlt = imgs.filter((i) => !/\balt=/.test(i)).length;
	if (noAlt) add("img without alt attr", `${rel} (${noAlt})`);
	for (const m of html.matchAll(/<a\b[^>]*\bhref="(\/[^"]*)/g)) {
		const href = dec(m[1]).split(/[?#]/)[0];
		if (href.startsWith("//")) continue;
		if (!exists(href)) (brokenLinks.get(href) || brokenLinks.set(href, new Set()).get(href)).add(rel);
	}
}
for (const [t, u] of titles) if (u.length > 1) add("duplicate title", `${u.length}x "${t.slice(0, 60)}" e.g. ${u.slice(0, 2).join(" ")}`);
for (const [t, u] of descs) if (u.length > 1) add("duplicate description", `${u.length}x "${t.slice(0, 50)}" e.g. ${u.slice(0, 2).join(" ")}`);
for (const [l, s] of brokenLinks) add("broken internal link", `${l} (from ${s.size} pages, e.g. ${[...s][0]})`);
// sitemap coverage
const sm = readdirSync(DIST).filter((f) => /^sitemap.*\.xml$/.test(f));
const locs = new Set(sm.flatMap((f) => [...readFileSync(join(DIST, f), "utf8").matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => dec(m[1]))));
console.log(`pages ${pages.length}; sitemap files ${sm.join(",")}; sitemap locs ${locs.size}`);
for (const l of locs) if (l.startsWith(ORIGIN) && !/sitemap.*\.xml$/.test(l) && !exists(l.slice(ORIGIN.length))) add("sitemap url 404", l);
console.log("schema types:", JSON.stringify(types));
for (const [k, v] of Object.entries(issues).sort((a, b) => b[1].length - a[1].length)) {
	console.log(`\n## ${k}: ${v.length}`);
	for (const x of v.slice(0, +process.env.N || 6)) console.log("   " + String(x).slice(0, 230));
}
const hard = ["og:image 404", "JSON-LD invalid", "sitemap url 404", "post without Article schema"].filter((k) => issues[k]);
if (hard.length) { console.error(`\nFAIL: ${hard.join(", ")}`); process.exit(1); }
