import fs from 'node:fs';
import path from 'node:path';

export interface MediumPost {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
  categories: string[];
  guid: string;
  author: string;
  slug: string;
}

export interface SummaryOverride {
  en?: string;
  tr?: string;
}

const MEDIUM_POSTS_PATH = path.join(process.cwd(), 'src/content/_medium/posts.json');
const SUMMARIES_PATH = path.join(process.cwd(), 'src/data/medium-summaries.json');

export function cleanMediumLink(link: string): string {
  try {
    const url = new URL(link);
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return link;
  }
}

export function slugFromMediumUrl(link: string, title = '', guid = ''): string {
  try {
    const url = new URL(link);
    const last = url.pathname.split('/').filter(Boolean).pop() || '';
    const cleaned = last.replace(/\.[a-z]+$/i, '');
    if (cleaned) return decodeURIComponent(cleaned);
  } catch {
    // fall through
  }

  const fromTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  if (fromTitle) return fromTitle;

  return guid.replace(/[^a-z0-9-]+/gi, '-').replace(/^-|-$/g, '') || 'medium-post';
}

export function mediumUrlWithUtm(link: string): string {
  try {
    const url = new URL(link);
    url.searchParams.set('utm_source', 'blog');
    url.searchParams.set('utm_medium', 'referral');
    url.searchParams.set('utm_campaign', 'blog_summary');
    return url.toString();
  } catch {
    return link;
  }
}

export function loadMediumPosts(): MediumPost[] {
  try {
    if (!fs.existsSync(MEDIUM_POSTS_PATH)) return [];
    const raw = JSON.parse(fs.readFileSync(MEDIUM_POSTS_PATH, 'utf-8')) as MediumPost[];
    const used = new Set<string>();

    return raw.map((post) => {
      let slug = post.slug || slugFromMediumUrl(post.link, post.title, post.guid);
      if (used.has(slug)) {
        const suffix = (post.guid || slug).slice(-8).replace(/[^a-z0-9]/gi, '');
        slug = `${slug}-${suffix || used.size}`;
      }
      used.add(slug);
      return {
        ...post,
        slug,
        link: cleanMediumLink(post.link),
        categories: post.categories || [],
        author: post.author || 'Ertugrul Kara',
      };
    });
  } catch (error) {
    console.error('Error loading Medium posts:', error);
    return [];
  }
}

let overrideCache: Record<string, SummaryOverride> | null = null;

export function loadSummaryOverrides(): Record<string, SummaryOverride> {
  if (overrideCache) return overrideCache;
  try {
    if (!fs.existsSync(SUMMARIES_PATH)) {
      overrideCache = {};
      return overrideCache;
    }
    overrideCache = JSON.parse(fs.readFileSync(SUMMARIES_PATH, 'utf-8')) as Record<string, SummaryOverride>;
    return overrideCache;
  } catch (error) {
    console.error('Error loading Medium summary overrides:', error);
    overrideCache = {};
    return overrideCache;
  }
}

export function uniqueSummary(post: MediumPost, lang: 'en' | 'tr' = 'en'): string {
  const overrides = loadSummaryOverrides();
  const override = overrides[post.slug]?.[lang];
  if (override?.trim()) return override.trim();

  const snippet = post.contentSnippet?.replace(/\s+/g, ' ').trim();
  if (snippet) return snippet;

  const topics = (post.categories || []).filter(Boolean).slice(0, 4);
  const topicList =
    topics.length > 0
      ? topics.join(', ')
      : lang === 'tr'
        ? 'yazılım mimarisi ve mühendislik'
        : 'software architecture and engineering';

  if (lang === 'tr') {
    return [
      `“${post.title}” Ertugrul Kara’nın ${topicList} üzerine yazdığı bir makalenin kısa özet sayfasıdır.`,
      'Bu sayfa keşif ve arşiv içindir; tam anlatım, örnekler ve ayrıntılar Medium’daki orijinal yazıdadır.',
      `Kimler için: ${topicList} ile ilgilenen yazılımcılar ve ekip liderleri.`,
    ].join(' ');
  }

  return [
    `“${post.title}” is a short overview of an article by Ertugrul Kara on ${topicList}.`,
    'This page exists so the piece is discoverable here; the full walkthrough lives on Medium.',
    `Written for engineers and leads who care about ${topicList}.`,
  ].join(' ');
}
