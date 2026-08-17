import type { APIRoute } from 'astro';
import { getAllTags, getCombinedPosts, hasTranslatedAlternate } from '../lib/posts';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function urlEntry(
  loc: string,
  lastmod: string,
  changefreq: string,
  priority: string,
  alternates?: { en: string; tr: string }
) {
  const links = alternates
    ? `
    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(alternates.en)}" />
    <xhtml:link rel="alternate" hreflang="tr" href="${escapeXml(alternates.tr)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(alternates.en)}" />`
    : '';

  return `  <url>
    <loc>${escapeXml(loc)}</loc>${links}
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = (site?.toString() || 'https://blog.ertugrulkara.com').replace(/\/$/, '');
  const now = new Date().toISOString();
  const enPosts = await getCombinedPosts('en');
  const trPosts = await getCombinedPosts('tr');
  const enTags = await getAllTags('en');
  const trTags = await getAllTags('tr');

  const staticUrls = [
    urlEntry(`${baseUrl}/`, now, 'weekly', '1.0', { en: `${baseUrl}/`, tr: `${baseUrl}/tr` }),
    urlEntry(`${baseUrl}/tr`, now, 'weekly', '1.0', { en: `${baseUrl}/`, tr: `${baseUrl}/tr` }),
    urlEntry(`${baseUrl}/about`, now, 'monthly', '0.8', { en: `${baseUrl}/about`, tr: `${baseUrl}/tr/about` }),
    urlEntry(`${baseUrl}/tr/about`, now, 'monthly', '0.8', { en: `${baseUrl}/about`, tr: `${baseUrl}/tr/about` }),
    urlEntry(`${baseUrl}/blog`, now, 'daily', '0.9', { en: `${baseUrl}/blog`, tr: `${baseUrl}/tr/blog` }),
    urlEntry(`${baseUrl}/tr/blog`, now, 'daily', '0.9', { en: `${baseUrl}/blog`, tr: `${baseUrl}/tr/blog` }),
    urlEntry(`${baseUrl}/tags`, now, 'weekly', '0.5', { en: `${baseUrl}/tags`, tr: `${baseUrl}/tr/tags` }),
    urlEntry(`${baseUrl}/tr/tags`, now, 'weekly', '0.5', { en: `${baseUrl}/tags`, tr: `${baseUrl}/tr/tags` }),
    urlEntry(`${baseUrl}/blog/archive`, now, 'weekly', '0.5', { en: `${baseUrl}/blog/archive`, tr: `${baseUrl}/tr/blog/archive` }),
    urlEntry(`${baseUrl}/tr/blog/archive`, now, 'weekly', '0.5', { en: `${baseUrl}/blog/archive`, tr: `${baseUrl}/tr/blog/archive` }),
  ];

  const postUrls: string[] = [];
  for (const post of enPosts) {
    const translated = await hasTranslatedAlternate(post.slug, post.type);
    postUrls.push(
      urlEntry(
        `${baseUrl}/blog/${post.slug}`,
        post.pubDate.toISOString(),
        'monthly',
        '0.7',
        translated ? { en: `${baseUrl}/blog/${post.slug}`, tr: `${baseUrl}/tr/blog/${post.slug}` } : undefined
      )
    );
  }
  for (const post of trPosts) {
    const translated = await hasTranslatedAlternate(post.slug, post.type);
    postUrls.push(
      urlEntry(
        `${baseUrl}/tr/blog/${post.slug}`,
        post.pubDate.toISOString(),
        'monthly',
        '0.7',
        translated ? { en: `${baseUrl}/blog/${post.slug}`, tr: `${baseUrl}/tr/blog/${post.slug}` } : undefined
      )
    );
  }

  const tagUrls = [
    ...enTags.map((tag) =>
      urlEntry(
        `${baseUrl}/tags/${encodeURIComponent(tag)}`,
        now,
        'weekly',
        '0.5',
        {
          en: `${baseUrl}/tags/${encodeURIComponent(tag)}`,
          tr: `${baseUrl}/tr/tags/${encodeURIComponent(tag)}`,
        }
      )
    ),
    ...trTags.map((tag) =>
      urlEntry(
        `${baseUrl}/tr/tags/${encodeURIComponent(tag)}`,
        now,
        'weekly',
        '0.5',
        {
          en: `${baseUrl}/tags/${encodeURIComponent(tag)}`,
          tr: `${baseUrl}/tr/tags/${encodeURIComponent(tag)}`,
        }
      )
    ),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[...staticUrls, ...postUrls, ...tagUrls].join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
