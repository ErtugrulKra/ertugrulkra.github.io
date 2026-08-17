import { getCombinedPosts } from './posts';
import { mediumUrlWithUtm } from './medium';
import type { Lang } from './i18n';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function buildRss(lang: Lang, site: URL | undefined) {
  const baseUrl = (site?.toString() || 'https://blog.ertugrulkara.com').replace(/\/$/, '');
  const posts = await getCombinedPosts(lang);
  const blogPath = lang === 'tr' ? '/tr/blog' : '/blog';
  const selfPath = lang === 'tr' ? '/tr/rss.xml' : '/rss.xml';

  const items = posts
    .map((post) => {
      const link =
        post.type === 'medium'
          ? mediumUrlWithUtm(post.link)
          : `${baseUrl}${lang === 'tr' ? '/tr' : ''}/blog/${post.slug}`;
      const guid = post.type === 'medium' ? post.guid : `${baseUrl}${lang === 'tr' ? '/tr' : ''}/blog/${post.slug}`;

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="${post.type === 'local' ? 'true' : 'false'}">${escapeXml(guid)}</guid>
      <pubDate>${post.pubDate.toUTCString()}</pubDate>
      <description>${escapeXml(post.description)}</description>
    </item>`;
    })
    .join('\n');

  const title = lang === 'tr' ? 'Ertugrul Kara (TR)' : 'Ertugrul Kara';
  const description =
    lang === 'tr'
      ? 'Ertugrul Kara’nın teknik yazı özetleri. Tam metinler Medium’da yayınlanır.'
      : 'Technical articles and summaries by Ertugrul Kara. Full pieces are published on Medium.';

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${title}</title>
    <link>${baseUrl}${blogPath}</link>
    <description>${escapeXml(description)}</description>
    <language>${lang}</language>
    <atom:link href="${baseUrl}${selfPath}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}
