// biome-ignore lint/suspicious/noShadowRestrictedNames: <toString from mdast-util-to-string>
import { toString } from "mdast-util-to-string";

/* Excerpt = the post's opening paragraphs, joined until there is enough text (160+ chars) to
   fill a meta description. One short first paragraph ("Use `docker ps`:") is not enough. */
export function remarkExcerpt() {
	return (tree, { data }) => {
		let excerpt = "";
		for (const node of tree.children) {
			if (node.type !== "paragraph") {
				continue;
			}
			excerpt = `${excerpt} ${toString(node)}`.replace(/\s+/g, " ").trim();
			if (excerpt.length >= 160) break;
		}
		data.astro.frontmatter.excerpt = excerpt;
	};
}
