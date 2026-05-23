import type { APIRoute } from "astro";


const robotsTxt = `
# Robots.txt for Anubhav Gain's Blog
# https://mranv.pages.dev

# Allow all search engines
User-agent: *
Allow: /
Disallow: /_astro/
Disallow: /api/
Disallow: /admin/
Crawl-delay: 1

# Google
User-agent: Googlebot
Allow: /
Disallow: /_astro/
Crawl-delay: 0

# Bing
User-agent: Bingbot
Allow: /
Disallow: /_astro/
Crawl-delay: 1

# Block bad bots
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
