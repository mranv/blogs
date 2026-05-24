import type { APIRoute } from "astro";


const robotsTxt = `
# Robots.txt for Anubhav Gain's Blog
# https://mranv.pages.dev

# Allow all search engines full, unthrottled crawling.
# Note: /_astro/ is intentionally NOT blocked — search engines need the
# CSS/JS there to render and assess pages (blocking it causes "crawled,
# currently not indexed"). No Crawl-delay — it only throttles Bing.
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

# Block aggressive commercial SEO crawlers to preserve crawl budget
User-agent: SemrushBot
Disallow: /

User-agent: AhrefsBot
Disallow: /

User-agent: DotBot
Disallow: /

# Sitemap location
Sitemap: ${new URL("sitemap-index.xml", import.meta.env.SITE).href}
`.trim();

export const GET: APIRoute = () => {
	return new Response(robotsTxt, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	});
};
