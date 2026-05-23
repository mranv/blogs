import getReadingTime from "reading-time";

/**
 * Lightweight reading time computation from raw markdown body text.
 * Avoids the full remark+rehype pipeline that entry.render() triggers.
 * Critical for scalability at 100K+ posts.
 */
export function computeReadingStats(body: string): {
	words: number;
	minutes: number;
	excerpt: string;
} {
	const stats = getReadingTime(body, { wordsPerMinute: 200 });
	const minutes = Math.max(1, Math.round(stats.minutes));

	// Extract first paragraph as excerpt (simple regex, no AST needed)
	const firstParagraph = body.match(/^[^#>\-\*]*\S.*$/m);
	const excerpt = firstParagraph
		? firstParagraph[0]
				.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // strip links
				.replace(/[*_~`#]/g, "") // strip markdown formatting
				.trim()
		: "";

	return {
		words: stats.words,
		minutes,
		excerpt: excerpt.slice(0, 200),
	};
}
