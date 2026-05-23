import type { APIRoute } from "astro";
import { siteConfig } from "@/config";


export const GET: APIRoute = ({ site }) => {
  const siteUrl = (site ?? new URL(import.meta.env.SITE || "https://mranv.pages.dev/")).toString();
  const searchTemplate = `${siteUrl}?search={searchTerms}`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
  <ShortName>${escapeXml(siteConfig.title)}</ShortName>
  <Description>${escapeXml(siteConfig.subtitle || "Site Search")}</Description>
  <InputEncoding>UTF-8</InputEncoding>
  <Url type="text/html" method="get" template="${searchTemplate}" />
  <Query role="example" searchTerms="astro security" />
</OpenSearchDescription>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/opensearchdescription+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
};

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

