import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site?.toString() || 'https://blog.ertugrulkara.com';
  
  const enPosts = await getCollection('en-posts');
  const trPosts = await getCollection('tr-posts');
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${baseUrl}/en</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/en" />
    <xhtml:link rel="alternate" hreflang="tr" href="${baseUrl}/tr" />
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/tr</loc>
    <xhtml:link rel="alternate" hreflang="tr" href="${baseUrl}/tr" />
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/en" />
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/en/about</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/en/about" />
    <xhtml:link rel="alternate" hreflang="tr" href="${baseUrl}/tr/about" />
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/tr/about</loc>
    <xhtml:link rel="alternate" hreflang="tr" href="${baseUrl}/tr/about" />
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/en/about" />
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/en/blog</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/en/blog" />
    <xhtml:link rel="alternate" hreflang="tr" href="${baseUrl}/tr/blog" />
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/tr/blog</loc>
    <xhtml:link rel="alternate" hreflang="tr" href="${baseUrl}/tr/blog" />
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/en/blog" />
    <priority>0.9</priority>
  </url>
  ${enPosts.map(post => `<url>
    <loc>${baseUrl}/en/blog/${post.slug}</loc>
    <lastmod>${post.data.pubDate.toISOString()}</lastmod>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/en/blog/${post.slug}" />
    <priority>0.7</priority>
  </url>`).join('\n  ')}
  ${trPosts.map(post => `<url>
    <loc>${baseUrl}/tr/blog/${post.slug}</loc>
    <lastmod>${post.data.pubDate.toISOString()}</lastmod>
    <xhtml:link rel="alternate" hreflang="tr" href="${baseUrl}/tr/blog/${post.slug}" />
    <priority>0.7</priority>
  </url>`).join('\n  ')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};

