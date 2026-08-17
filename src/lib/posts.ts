import { getCollection, type CollectionEntry } from 'astro:content';
import { loadMediumPosts, loadSummaryOverrides, uniqueSummary, type MediumPost } from './medium';
import { readingTimeMinutes } from './reading';
import { POSTS_PER_PAGE, blogPageHref, type Lang } from './i18n';

export type CombinedPost =
  | {
      type: 'local';
      slug: string;
      title: string;
      description: string;
      pubDate: Date;
      updatedDate?: Date;
      tags: string[];
      author: string;
      lang: string;
      image?: string;
      readingMinutes: number;
    }
  | {
      type: 'medium';
      slug: string;
      title: string;
      description: string;
      pubDate: Date;
      tags: string[];
      author: string;
      lang: string;
      link: string;
      guid: string;
      readingMinutes: number;
    };

function isPublishedLocal<T extends CollectionEntry<'en-posts'> | CollectionEntry<'tr-posts'>>(entry: T): boolean {
  if (entry.id.startsWith('_')) return false;
  if (entry.data.draft) return false;
  return true;
}

async function loadLocalPosts(lang: 'en' | 'tr') {
  try {
    if (lang === 'tr') {
      return (await getCollection('tr-posts', ({ data }) => data.lang === 'tr')).filter(isPublishedLocal);
    }
    return (await getCollection('en-posts', ({ data }) => data.lang === 'en')).filter(isPublishedLocal);
  } catch {
    return [] as CollectionEntry<'en-posts'>[] | CollectionEntry<'tr-posts'>[];
  }
}

export async function getCombinedPosts(lang: 'en' | 'tr'): Promise<CombinedPost[]> {
  const local = await loadLocalPosts(lang);
  const medium = loadMediumPosts();
  const localSlugs = new Set(local.map((post) => post.slug));

  const combined: CombinedPost[] = [
    ...local.map((post) => ({
      type: 'local' as const,
      slug: post.slug,
      title: post.data.title,
      description: post.data.description || '',
      pubDate: post.data.pubDate,
      updatedDate: post.data.updatedDate,
      tags: post.data.tags || [],
      author: post.data.author || 'Ertugrul Kara',
      lang,
      image: post.data.image,
      readingMinutes: readingTimeMinutes(post.body || post.data.description || post.data.title),
    })),
    ...medium
      .filter((post) => !localSlugs.has(post.slug))
      .map((post) => {
        const description = uniqueSummary(post, lang);
        return {
          type: 'medium' as const,
          slug: post.slug,
          title: post.title,
          description,
          pubDate: new Date(post.pubDate),
          tags: post.categories || [],
          author: post.author || 'Ertugrul Kara',
          lang,
          link: post.link,
          guid: post.guid,
          readingMinutes: readingTimeMinutes(`${post.title} ${description}`),
        };
      }),
  ];

  return combined.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
}

export function findMediumPost(slug: string): MediumPost | undefined {
  return loadMediumPosts().find((post) => post.slug === slug);
}

export async function getAllTags(lang: 'en' | 'tr'): Promise<string[]> {
  const posts = await getCombinedPosts(lang);
  const tags = new Set<string>();
  for (const post of posts) {
    post.tags.forEach((tag) => tags.add(tag));
  }
  return Array.from(tags).sort();
}

export async function getTagCounts(lang: 'en' | 'tr'): Promise<{ tag: string; count: number }[]> {
  const posts = await getCombinedPosts(lang);
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function getRelatedPosts(
  all: CombinedPost[],
  currentSlug: string,
  tags: string[],
  limit = 3
): CombinedPost[] {
  const scored = all
    .filter((post) => post.slug !== currentSlug)
    .map((post) => ({
      post,
      score: post.tags.filter((tag) => tags.includes(tag)).length,
    }))
    .sort((a, b) => b.score - a.score || b.post.pubDate.getTime() - a.post.pubDate.getTime());

  const withTags = scored.filter((item) => item.score > 0).slice(0, limit).map((item) => item.post);
  if (withTags.length >= limit) return withTags;

  const used = new Set(withTags.map((post) => post.slug));
  const rest = all.filter((post) => post.slug !== currentSlug && !used.has(post.slug));
  return [...withTags, ...rest.slice(0, limit - withTags.length)];
}

export function paginatePosts(posts: CombinedPost[], page: number, lang: Lang) {
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const current = Math.min(Math.max(1, page), totalPages);
  return {
    items: posts.slice((current - 1) * POSTS_PER_PAGE, current * POSTS_PER_PAGE),
    current,
    totalPages,
    total: posts.length,
    hasPrev: current > 1,
    hasNext: current < totalPages,
    prevHref: current > 1 ? blogPageHref(lang, current - 1) : undefined,
    nextHref: current < totalPages ? blogPageHref(lang, current + 1) : undefined,
  };
}

export async function getBlogPageCount(lang: Lang): Promise<number> {
  const posts = await getCombinedPosts(lang);
  return Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
}

export async function hasTranslatedAlternate(slug: string, type: 'local' | 'medium'): Promise<boolean> {
  if (type === 'medium') {
    const override = loadSummaryOverrides()[slug];
    return Boolean(override?.tr?.trim());
  }

  try {
    const [en, tr] = await Promise.all([
      getCollection('en-posts', (entry) => entry.slug === slug && isPublishedLocal(entry)),
      getCollection('tr-posts', (entry) => entry.slug === slug && isPublishedLocal(entry)),
    ]);
    return en.length > 0 && tr.length > 0;
  } catch {
    return false;
  }
}

export function groupPostsByYear(posts: CombinedPost[]): { year: number; posts: CombinedPost[] }[] {
  const groups = new Map<number, CombinedPost[]>();
  for (const post of posts) {
    const year = post.pubDate.getFullYear();
    const list = groups.get(year) || [];
    list.push(post);
    groups.set(year, list);
  }
  return Array.from(groups.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, yearPosts]) => ({ year, posts: yearPosts }));
}
