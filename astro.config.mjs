import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import tailwind from "@astrojs/tailwind";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import swup from "@swup/astro";
import expressiveCode from "astro-expressive-code";
import icon from "astro-icon";
import { defineConfig } from "astro/config";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeComponents from "rehype-components"; /* Render the custom directive content */
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkDirective from "remark-directive"; /* Handle directives */
import remarkGithubAdmonitionsToDirectives from "remark-github-admonitions-to-directives";
import remarkMath from "remark-math";
import remarkSectionize from "remark-sectionize";
import { expressiveCodeConfig } from "./src/config.ts";
import { pluginLanguageBadge } from "./src/plugins/expressive-code/language-badge.ts";
import { AdmonitionComponent } from "./src/plugins/rehype-component-admonition.mjs";
import { GithubCardComponent } from "./src/plugins/rehype-component-github-card.mjs";
import { parseDirectiveNode } from "./src/plugins/remark-directive-rehype.js";
import { remarkExcerpt } from "./src/plugins/remark-excerpt.js";
import { remarkReadingTime } from "./src/plugins/remark-reading-time.mjs";
import { pluginCustomCopyButton } from "./src/plugins/expressive-code/custom-copy-button.ts";
import { remarkMermaid } from "./src/plugins/remark-mermaid.mjs";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = "https://mranv.pages.dev/";

// Build a URL -> lastmod map from post frontmatter so the sitemap carries
// accurate <lastmod>, which helps search engines schedule re-crawls.
// All posts use a flat frontmatter `slug`, so the URL is `${SITE}posts/<slug>/`.
function buildLastmodMap() {
	const postsDir = fileURLToPath(new URL("./src/content/posts", import.meta.url));
	const map = {};
	const walk = (dir) => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const p = join(dir, entry.name);
			if (entry.isDirectory()) walk(p);
			else if (entry.name.endsWith(".md") || entry.name.endsWith(".mdx")) {
				try {
					const text = readFileSync(p, "utf8");
					const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
					if (!m) continue;
					const fm = m[1];
					const get = (k) => {
						const r = new RegExp(`^${k}:\\s*(.+)$`, "m").exec(fm);
						return r ? r[1].trim().replace(/^['"]|['"]$/g, "") : undefined;
					};
					if (get("draft") === "true") continue;
					const slug = get("slug");
					if (!slug) continue;
					const raw =
						get("modDatetime") || get("modified") || get("updated") ||
						get("pubDatetime") || get("published") || get("publishDate") || get("pubDate");
					if (!raw) continue;
					const d = new Date(raw);
					if (Number.isNaN(d.getTime())) continue;
					map[`${SITE_URL}posts/${slug}/`] = d.toISOString();
				} catch { /* skip unreadable file */ }
			}
		}
	};
	try { walk(postsDir); } catch (e) { console.warn("[sitemap] lastmod map failed:", e?.message); }
	return map;
}
const lastmodMap = buildLastmodMap();

// https://astro.build/config
export default defineConfig({
	site: "https://mranv.pages.dev/",
	base: "/",
	trailingSlash: "always",
	output: "static",
	// Switch to "server" with cloudflare adapter when scaling beyond 10K posts.
	// Requires Astro 6+ and @astrojs/cloudflare compatible version.
	// adapter: cloudflare({ imageService: "compile" }),
	integrations: [
		tailwind({
			nesting: true,
		}),
		swup({
			theme: false,
			animationClass: "transition-swup-", // see https://swup.js.org/options/#animationselector
			// the default value `transition-` cause transition delay
			// when the Tailwind class `transition-all` is used
			containers: ["main", "#toc"],
			smoothScrolling: true,
			cache: true,
			preload: true,
			accessibility: true,
			updateHead: true,
			updateBodyClass: false,
			globalInstance: true,
		}),
		icon({
			include: {
				"material-symbols": ["*"],
				"fa6-brands": ["*"],
				"fa6-regular": ["*"],
				"fa6-solid": ["*"],
			},
		}),
		expressiveCode({
			themes: [expressiveCodeConfig.theme],
			langs: [
				'dockerfile', 'pycon', 'html+jinja', 'html+django', 'jq',
				'vcl', 'svg', 'powershell', 'javascript', 'bash', 'python',
				'text', 'json', 'yaml', 'rust', 'go', 'typescript', 'tsx',
				'shell', 'shellscript', 'toml', 'ini', 'diff', 'sql',
				'c', 'cpp', 'java', 'ruby', 'php', 'swift', 'kotlin',
				'hcl', 'groovy', 'makefile', 'docker', 'graphql', 'protobuf',
			],
			plugins: [
				pluginCollapsibleSections(),
				pluginLineNumbers(),
				pluginLanguageBadge(),
				pluginCustomCopyButton()
			],
			defaultProps: {
				wrap: true,
				overridesByLang: {
					'shellsession': {
						showLineNumbers: false,
					},
				},
			},
			styleOverrides: {
				codeBackground: "var(--codeblock-bg)",
				borderRadius: "0.75rem",
				borderColor: "none",
				codeFontSize: "0.875rem",
				codeFontFamily: "'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
				codeLineHeight: "1.5rem",
				frames: {
					editorBackground: "var(--codeblock-bg)",
					terminalBackground: "var(--codeblock-bg)",
					terminalTitlebarBackground: "var(--codeblock-topbar-bg)",
					editorTabBarBackground: "var(--codeblock-topbar-bg)",
					editorActiveTabBackground: "none",
					editorActiveTabIndicatorBottomColor: "var(--primary)",
					editorActiveTabIndicatorTopColor: "none",
					editorTabBarBorderBottomColor: "var(--codeblock-topbar-bg)",
					terminalTitlebarBorderBottomColor: "none"
				},
				textMarkers: {
					delHue: 0,
					insHue: 180,
					markHue: 250
				}
			},
			frames: {
				showCopyToClipboardButton: false,
			}
		}),
        svelte(),
		sitemap({
			// Drop root pagination pages (/2/, /3/ …) — low-value duplicates that
			// waste crawl budget. Real content stays discoverable via links.
			filter: (page) => !/^\/\d+\/$/.test(new URL(page).pathname),
			serialize(item) {
				const lm = lastmodMap[item.url];
				if (lm) item.lastmod = lm;
				return item;
			},
		}),
	],
	markdown: {
		remarkPlugins: [
			remarkMermaid,
			remarkMath,
			remarkReadingTime,
			remarkExcerpt,
			remarkGithubAdmonitionsToDirectives,
			remarkDirective,
			remarkSectionize,
			parseDirectiveNode,
		],
		rehypePlugins: [
			rehypeKatex,
			rehypeSlug,
			[
				rehypeComponents,
				{
					components: {
						github: GithubCardComponent,
						note: (x, y) => AdmonitionComponent(x, y, "note"),
						tip: (x, y) => AdmonitionComponent(x, y, "tip"),
						important: (x, y) => AdmonitionComponent(x, y, "important"),
						caution: (x, y) => AdmonitionComponent(x, y, "caution"),
						warning: (x, y) => AdmonitionComponent(x, y, "warning"),
					},
				},
			],
			[
				rehypeAutolinkHeadings,
				{
					behavior: "append",
					properties: {
						className: ["anchor"],
					},
					content: {
						type: "element",
						tagName: "span",
						properties: {
							className: ["anchor-icon"],
							"data-pagefind-ignore": true,
						},
						children: [
							{
								type: "text",
								value: "#",
							},
						],
					},
				},
			],
		],
	},
	vite: {
		build: {
			rollupOptions: {
				onwarn(warning, warn) {
					// temporarily suppress this warning
					if (
						warning.message.includes("is dynamically imported by") &&
						warning.message.includes("but also statically imported by")
					) {
						return;
					}
					warn(warning);
				},
				output: {
					manualChunks: (id) => {
						if (id.includes('node_modules')) {
							// Split vendor into meaningful chunks instead of one 3.2MB blob
							if (id.includes('shiki') || id.includes('expressive-code')) return 'vendor-code';
							if (id.includes('katex') || id.includes('remark') || id.includes('rehype') || id.includes('unified') || id.includes('micromark') || id.includes('mdast')) return 'vendor-markdown';
							if (id.includes('mermaid')) return 'vendor-mermaid';
							if (id.includes('svelte') || id.includes('swup')) return 'vendor-ui';
							if (id.includes('iconify') || id.includes('material-symbols')) return 'vendor-icons';
							return 'vendor';
						}
					},
				},
			},
			maxParallelFileOps: 5,
		},
		ssr: {
			noExternal: ['sharp'],
		},
	},
	build: {
		inlineStylesheets: "auto",
		concurrency: 4,
	},
});
