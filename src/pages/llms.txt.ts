// /llms.txt, generated at build so it never goes stale (the hand-written file said "1500+
// posts" long after that stopped being true). Format: llmstxt.org (H1, blockquote, H2 link
// lists, "Optional" last = first to drop under a tight context budget).
// Hand-written half: src/data/llms-intro.md (who the author is, flagship projects, series).
// Generated half: post count, topics with counts, latest posts. See docs/SEO.md.
import type { APIRoute } from "astro";
import intro from "../data/llms-intro.md?raw";
import { getCategoryList, getSortedPosts } from "../utils/content-utils";

const LATEST = 40; // ponytail: fixed cut; llms-full.txt and the sitemap carry the long tail.
const TOPICS = 25;

export const GET: APIRoute = async ({ site }) => {
	const posts = await getSortedPosts();
	const categories = (await getCategoryList()).sort((a, b) => b.count - a.count).slice(0, TOPICS);
	const abs = (path: string) => new URL(path, site).href;
	// One line per link: a newline inside a title or description would break the list item.
	const line = (s: string) => s.replace(/\s+/g, " ").trim();

	const body = [
		intro.trim(),
		`## Topics\n\n${posts.length} posts in total. Largest categories:\n`,
		categories.map((c) => `- [${line(c.name)}](${abs(`archive/?category=${encodeURIComponent(c.name)}`)}): ${c.count} posts`).join("\n"),
		`\n## Latest Posts\n`,
		posts.slice(0, LATEST).map((p) => {
			const d = line(p.data.description || "");
			return `- [${line(p.data.title)}](${abs(`posts/${p.slug}/`)})${d ? `: ${d}` : ""}`;
		}).join("\n"),
		`\n## RSS & Discovery\n`,
		`- [Archive](${abs("archive/")}): All ${posts.length} posts, filterable by tag and category`,
		`- [RSS Feed](${abs("rss.xml")}): Latest 100 posts`,
		`- [Sitemap](${abs("sitemap-index.xml")}): Every URL with last-modified dates`,
		`- [Full profile for LLMs](${abs("llms-full.txt")}): Long-form identity, expertise and project detail`,
		`\n## Optional\n`,
		`- [Instagram](https://www.instagram.com/anubhavgain/): Personal updates`,
	].join("\n");

	return new Response(`${body}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
