import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL(import.meta.env.SITE || "https://mranv.pages.dev/");
  const target = new URL("sitemap-index.xml", base).href;
  return new Response(null, {
    status: 308,
    headers: {
      Location: target,
      "Cache-Control": "public, max-age=3600"
    }
  });
};

