// Social cards, generated for every built page:  node scripts/og/build.mjs [dist]
//
// Runs after `astro build` (see package.json). For each dist/**/*.html whose og:image points
// at /og/<path>.png (set in src/layouts/Layout.astro), it writes that 1200x630 PNG: a frame of
// the page's own ASCII art piece on top, the page title below. scripts/seo-audit.mjs runs next
// and fails the build if any og:image is missing, so a page can never ship without its card.
//
// Why a post-build script and not an Astro endpoint: the Astro build already peaks near the
// Cloudflare Pages memory limit (docs/UI_UPGRADE_PLAN.md); this runs in its own process,
// one image at a time.
// Why glyph atlases (make-atlas.mjs) and not SVG text: the builder has none of our fonts.
import { mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = process.argv[2] || "dist";
const ART = join(HERE, "../../public/ascii-magic-art/pieces");
const W = 1200, H = 630;
// Paper & Ink palette (src/styles/variables.styl): bone ink, muted ink, signal.
const INK = [244, 239, 230], MUTED = [149, 143, 135], SIGNAL = [206, 94, 50];
const CELL_W = 12, CELL_H = 22; // mono atlas cell, see make-atlas.mjs
const ART_ROWS = 13, ART_H = ART_ROWS * CELL_H; // art band = top 286px
const TITLE_STEP = 68, TITLE_MAX_W = W - 140, TITLE_MAX_LINES = 3;

const meta = JSON.parse(readFileSync(join(HERE, "atlas.json"), "utf8"));
const atlas = {};
for (const [name, m] of Object.entries(meta)) {
	const { data, info } = await sharp(join(HERE, `${name}.png`)).extractChannel(0).raw().toBuffer({ resolveWithObject: true });
	const glyphs = new Map();
	let x = 0;
	[...m.chars].forEach((ch, i) => { glyphs.set(ch, { x, w: m.w[i] }); x += m.w[i]; });
	atlas[name] = { data, width: info.width, height: info.height, glyphs };
}

// Additive blit of one glyph: coverage (0-255) x colour x strength, clipped to the card.
function glyph(buf, font, ch, px, py, rgb, strength = 1, maxY = H) {
	const a = atlas[font], g = a.glyphs.get(ch);
	if (!g) return 0;
	for (let y = 0; y < a.height; y++) {
		const Y = py + y;
		if (Y < 0 || Y >= maxY) continue;
		for (let x = 0; x < g.w; x++) {
			const X = px + x;
			if (X < 0 || X >= W) continue;
			const c = a.data[g.x + x + y * a.width];
			if (!c) continue;
			const o = (X + Y * W) * 3, k = (c / 255) * strength;
			for (let i = 0; i < 3; i++) buf[o + i] = Math.min(255, buf[o + i] + rgb[i] * k);
		}
	}
	return g.w;
}
const text = (buf, font, s, x, y, rgb) => { for (const ch of s) x += glyph(buf, font, ch, x, y, rgb); return x; };
const width = (font, s) => [...s].reduce((n, ch) => n + (atlas[font].glyphs.get(ch)?.w || 0), 0);

// Titles are drawn from a Latin atlas: fold accents, drop what is still not in it.
const clean = (s) => [...s.normalize("NFKD")].filter((ch) => atlas.title.glyphs.has(ch)).join("").replace(/\s+/g, " ").trim();
function wrap(title) {
	const lines = [];
	for (const word of title.split(" ")) {
		const last = lines[lines.length - 1];
		if (last !== undefined && width("title", `${last} ${word}`) <= TITLE_MAX_W) lines[lines.length - 1] = `${last} ${word}`;
		else lines.push(word);
	}
	if (lines.length > TITLE_MAX_LINES) {
		lines.length = TITLE_MAX_LINES;
		let l = lines[TITLE_MAX_LINES - 1];
		while (width("title", `${l}...`) > TITLE_MAX_W) l = l.slice(0, -1);
		lines[TITLE_MAX_LINES - 1] = `${l.trimEnd()}...`;
	}
	return lines;
}

// One running animation per piece; every page takes the next frames, so no two cards of the
// same piece show the same picture. Luminance of the piece's colour sets the ink strength.
const pieces = new Map();
async function artFrame(slug) {
	if (!pieces.has(slug)) {
		const m = await import(pathToFileURL(join(ART, `${slug}.js`)).href);
		const lum = {};
		for (const [k, hex] of Object.entries(m.meta.palette || {})) {
			const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
			lum[k] = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
		}
		const p = { draw: m.default(), fps: m.meta.fps || 24, n: 0, lum };
		for (; p.n < 90; p.n++) p.draw(p.n / p.fps, p.n); // warm up past the empty first frames
		pieces.set(slug, p);
	}
	const p = pieces.get(slug);
	let f;
	for (let i = 0; i < 3; i++, p.n++) f = p.draw(p.n / p.fps, p.n);
	const rows = (s) => (Array.isArray(s) ? s : String(s ?? "").split("\n"));
	return { text: rows(f.text), color: rows(f.color), lum: p.lum };
}

const PIECES = readdirSync(ART).map((f) => f.replace(/\.js$/, "")).filter((s) => s !== "page-404").sort();
const dec = (s) => s.replace(/&amp;|&#38;/g, "&").replace(/&#39;/g, "'").replace(/&quot;|&#34;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const metaTag = (head, key) => (head.match(new RegExp(`<meta[^>]*(?:name|property)="${key}"[^>]*?content="([^"]*)"`, "i")) || [])[1];

async function card(html, rel) {
	const head = html.slice(0, html.indexOf("</head>"));
	const og = /\/og\/(.+\.png)$/.exec(metaTag(head, "og:image") || "");
	if (!og) return false;
	const buf = Buffer.alloc(W * H * 3); // black paper

	// Same piece the page itself shows (AsciiArt.astro); pages without a strip get one by hash.
	let h = 0;
	for (const c of rel) h = (h * 31 + c.charCodeAt(0)) >>> 0;
	const slug = (html.match(/<ascii-art piece="([^"]+)"/) || [])[1] || PIECES[h % PIECES.length];
	const art = await artFrame(slug);
	const x0 = Math.round((W - Math.max(...art.text.map((l) => [...l].length)) * CELL_W) / 2);
	const r0 = Math.max(0, Math.floor((art.text.length - ART_ROWS) / 2));
	const y0 = Math.max(0, Math.floor((ART_ROWS - art.text.length) / 2)) * CELL_H;
	for (let r = 0; r < ART_ROWS && r0 + r < art.text.length; r++) {
		const chars = [...art.text[r0 + r]], keys = [...(art.color[r0 + r] || "")];
		chars.forEach((ch, c) => {
			if (ch !== " ") glyph(buf, "mono", ch, x0 + c * CELL_W, y0 + r * CELL_H, INK, 0.25 + 0.6 * (art.lum[keys[c]] ?? 0.5), ART_H);
		});
	}
	for (let x = 0; x < W; x++) buf.set(MUTED.map((v) => v * 0.6), (x + ART_H * W) * 3); // hairline

	const title = clean(dec(metaTag(head, "og:title") || "Anubhav Gain").replace(/ - Anubhav Gain$/, ""));
	const post = /"articleSection":"([^"]*)"[\s\S]*?/.exec(html) && /"datePublished":"([^"]*)"/.exec(html);
	const section = (/"articleSection":"([^"]*)"/.exec(html) || [])[1];
	const footer = post ? `${section} / ${post[1]}` : `mranv.pages.dev${rel === "/" ? "" : rel}`;
	const lines = wrap(title);
	text(buf, "mono", "ANUBHAV GAIN", 70, ART_H + 24, SIGNAL);
	// Fewer lines sit lower so the block stays visually centred between eyebrow and footer.
	const ty = ART_H + 64 + Math.round(((TITLE_MAX_LINES - lines.length) * TITLE_STEP) / 2);
	lines.forEach((l, i) => text(buf, "title", l, 68, ty + i * TITLE_STEP, INK));
	text(buf, "mono", [...footer].filter((ch) => atlas.mono.glyphs.has(ch)).join("").slice(0, 88), 70, H - 52, MUTED);

	const out = join(DIST, "og", decodeURIComponent(og[1]));
	mkdirSync(dirname(out), { recursive: true });
	// ponytail: 16-colour palette PNG keeps 1,700 cards small; raise `colours` if text edges band.
	await sharp(buf, { raw: { width: W, height: H, channels: 3 } }).png({ palette: true, colours: 16, effort: 4 }).toFile(out);
	return true;
}

const files = [];
(function walk(d) {
	for (const f of readdirSync(d).sort()) {
		const p = join(d, f);
		if (statSync(p).isDirectory()) { if (!["_astro", "pagefind", "og"].includes(f)) walk(p); }
		else if (f.endsWith(".html")) files.push(p);
	}
})(DIST);
const t0 = Date.now();
let n = 0;
for (const file of files) {
	const rel = file.slice(DIST.length).replace(/index\.html$/, "");
	if (await card(readFileSync(file, "utf8"), rel)) n++;
}
console.log(`[og] ${n} social cards for ${files.length} pages in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
