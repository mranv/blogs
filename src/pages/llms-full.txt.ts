// /llms-full.txt, generated at build: the hand-written profile (src/data/llms-full-intro.md)
// followed by an index of every post, newest first, so the file can never lag the content.
// Sibling of llms.txt.ts (the short navigational file). See docs/SEO.md.
import type { APIRoute } from "astro";
import intro from "../data/llms-full-intro.md?raw";
import { getSortedPosts } from "../utils/content-utils";
import { formatDateToYYYYMMDD } from "../utils/date-utils";

export const GET: APIRoute = async ({ site }) => {
	const posts = await getSortedPosts();
	// One line per post: a newline inside a title or description would break the list item.
	const line = (s: string) => s.replace(/\s+/g, " ").trim();
	const index = posts.map((p) => {
		const date = p.data.pubDatetime || p.data.published;
		const d = line(p.data.description || "");
		return `- ${date ? `${formatDateToYYYYMMDD(date)} ` : ""}[${line(p.data.title)}](${new URL(`posts/${p.slug}/`, site).href})${d ? `: ${d}` : ""}`;
	});
	const body = `${intro.trim()}\n\n---\n\n## Every Post (${posts.length}, newest first)\n\n${index.join("\n")}\n`;
	return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
