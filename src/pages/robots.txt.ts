import type { APIRoute } from 'astro';

// Let everything be crawled (link-preview bots such as X's obey robots.txt,
// so the share links must stay open; they carry noindex instead), and point
// search engines at the sitemap.
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', site)}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
