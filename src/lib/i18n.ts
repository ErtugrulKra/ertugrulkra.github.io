export type Lang = 'en' | 'tr';

export function localePrefix(lang: Lang): string {
  return lang === 'tr' ? '/tr' : '';
}

export function localePath(lang: Lang, path: string): string {
  const prefix = localePrefix(lang);
  if (path === '/') return prefix || '/';
  return `${prefix}${path}`;
}

export function isHomePath(currentPath: string, lang: Lang): boolean {
  return lang === 'tr' ? currentPath === '/tr' : currentPath === '/';
}

export function isAboutPath(currentPath: string, lang: Lang): boolean {
  return currentPath === localePath(lang, '/about');
}

export function isBlogPath(currentPath: string, lang: Lang): boolean {
  const blog = localePath(lang, '/blog');
  return currentPath === blog || currentPath.startsWith(`${blog}/`);
}

export const POSTS_PER_PAGE = 12;

export function blogPageHref(lang: Lang, page: number): string {
  if (page <= 1) return localePath(lang, '/blog');
  return localePath(lang, `/blog/page/${page}`);
}

export function t(lang: Lang, key: keyof typeof strings.en): string {
  return strings[lang][key];
}

export const strings = {
  en: {
    home: 'Home',
    about: 'About',
    blog: 'Blog',
    search: 'Search',
    tags: 'Tags',
    archive: 'Archive',
    rss: 'RSS',
    skipToContent: 'Skip to content',
    allRights: 'All rights reserved.',
    noResults: 'No results found.',
    searchPlaceholder: 'Search posts...',
    searchLead: 'Find article summaries on this site. Full pieces are on Medium.',
    readMore: 'Read more →',
    readSummary: 'Read summary →',
    viewAll: 'View All Posts',
    viewBlog: 'View Blog',
    viewResume: 'View Resume',
    recentPosts: 'Recent Posts',
    relatedPosts: 'Related posts',
    share: 'Share',
    copyLink: 'Copy link',
    copied: 'Copied',
    by: 'by',
    prev: 'Previous',
    next: 'Next',
    notFoundTitle: 'Page not found',
    notFoundBody: 'That page does not exist, or it may have moved.',
    backHome: 'Back to home',
    toc: 'On this page',
    comments: 'Comments',
    darkMode: 'Dark mode',
    lightMode: 'Light mode',
    switchToTr: 'Türkçe',
    switchToEn: 'English',
    noPosts: 'No posts yet. Check back soon!',
    noPostsTag: 'No posts found with this tag.',
    fullOnMedium: 'Full article on Medium',
    minRead: 'min read',
    pageLabel: 'Page',
    tagCloudTitle: 'Tags',
    archiveTitle: 'Archive',
    whatIDo: 'What I Do',
  },
  tr: {
    home: 'Ana Sayfa',
    about: 'Hakkımda',
    blog: 'Blog',
    search: 'Ara',
    tags: 'Etiketler',
    archive: 'Arşiv',
    rss: 'RSS',
    skipToContent: 'İçeriğe geç',
    allRights: 'Tüm hakları saklıdır.',
    noResults: 'Sonuç bulunamadı.',
    searchPlaceholder: 'Yazı ara...',
    searchLead: 'Bu sitedeki yazı özetlerini arayın. Tam metinler Medium’dadır.',
    readMore: 'Devamını oku →',
    readSummary: 'Özeti oku →',
    viewAll: 'Tüm Yazıları Gör',
    viewBlog: "Blog'a Git",
    viewResume: 'Özgeçmiş',
    recentPosts: 'Son Yazılar',
    relatedPosts: 'İlgili yazılar',
    share: 'Paylaş',
    copyLink: 'Bağlantıyı kopyala',
    copied: 'Kopyalandı',
    by: 'yazar',
    prev: 'Önceki',
    next: 'Sonraki',
    notFoundTitle: 'Sayfa bulunamadı',
    notFoundBody: 'Bu sayfa yok veya taşınmış olabilir.',
    backHome: 'Ana sayfaya dön',
    toc: 'Bu sayfada',
    comments: 'Yorumlar',
    darkMode: 'Koyu tema',
    lightMode: 'Açık tema',
    switchToTr: 'Türkçe',
    switchToEn: 'English',
    noPosts: 'Henüz yazı yok. Yakında tekrar kontrol edin!',
    noPostsTag: 'Bu etiketle yazı bulunamadı.',
    fullOnMedium: 'Tam yazı Medium’da',
    minRead: 'dk okuma',
    pageLabel: 'Sayfa',
    tagCloudTitle: 'Etiketler',
    archiveTitle: 'Arşiv',
    whatIDo: 'Ne Yapıyorum',
  },
} as const;
