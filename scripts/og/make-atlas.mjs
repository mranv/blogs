// Dev-time only: rasterises the two fonts the social cards use into glyph atlases
// (mono.png, title.png + atlas.json), which are committed. scripts/og/build.mjs blits from
// them, so the build needs no fonts installed (the Cloudflare Pages builder has none of ours).
//
// Re-run only to change a font, a size or the character set:
//   node scripts/og/make-atlas.mjs      (needs ImageMagick 7 and the fonts below)
// The mono set must cover every glyph the pieces in public/ascii-magic-art/pieces can emit;
// a glyph missing from the atlas is drawn as a blank cell.
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = dirname(fileURLToPath(import.meta.url));
const TMP = mkdtempSync(join(tmpdir(), "og-atlas-"));
const ASCII = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join("");
const FONTS = {
	// Fixed cell: art glyphs (incl. block elements) must tile edge to edge.
	mono: { font: "/usr/share/fonts/TTF/SpaceMonoNerdFontMono-Regular.ttf", size: 20, cell: [12, 22],
		chars: ASCII + "·•←↑→↓↖↗↘↙─│┌┐└┘╱╲▀▄█▌▐░▒▓▖▗▘▙▚▛▜▝▞▟■►◄◆○●" },
	// Proportional: per-glyph advance widths are stored in atlas.json.
	title: { font: "/usr/share/fonts/OTF/SpaceGrotesk-Bold.otf", size: 58, chars: ASCII + "·—–‘’“”…" },
};
const magick = (...a) => execFileSync("magick", a, { encoding: "utf8" });
const meta = {};
for (const [name, f] of Object.entries(FONTS)) {
	const render = (text, file) => {
		writeFileSync(join(TMP, "t.txt"), text);
		magick("-background", "black", "-fill", "white", "-font", f.font, "-pointsize", String(f.size), `label:@${join(TMP, "t.txt")}`, file);
		return +magick("identify", "-format", "%w", file);
	};
	const wA = render("a", join(TMP, "a.png"));
	const files = [], w = [];
	[...f.chars].forEach((ch, i) => {
		const file = join(TMP, `${name}-${i}.png`);
		// A lone space renders as nothing: measure it between two letters instead.
		let width = ch === " " ? render("a a", file) - 2 * wA : render(ch, file);
		if (ch === " ") magick("-size", `${width}x1`, "xc:black", file);
		if (f.cell) { magick(file, "-background", "black", "-gravity", "center", "-extent", `${f.cell[0]}x${f.cell[1]}`, file); width = f.cell[0]; }
		files.push(file); w.push(width);
	});
	magick(...files, "-background", "black", "-gravity", "north", "+append", "-colorspace", "Gray", "-strip", join(OUT, `${name}.png`));
	meta[name] = { chars: f.chars, w };
}
writeFileSync(join(OUT, "atlas.json"), JSON.stringify(meta) + "\n");
console.log("wrote mono.png, title.png, atlas.json");
