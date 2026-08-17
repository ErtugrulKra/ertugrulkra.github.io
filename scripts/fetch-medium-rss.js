import fs from 'fs';
import path from 'path';
import Parser from 'rss-parser';

const USERNAME = 'ertugrulkra';
const RSS_URL = `https://medium.com/feed/@${USERNAME}`;
const GRAPHQL_URL = 'https://medium.com/_/graphql';
const AUTHOR = 'Ertugrul Kara';
const PAGE_SIZE = 25;
const MAX_PAGES = 20;

const parser = new Parser();

const mediumHeaders = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Origin: 'https://medium.com',
  Referer: `https://medium.com/@${USERNAME}`,
};

function cleanMediumLink(link = '') {
  try {
    const url = new URL(link);
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return link;
  }
}

function slugFromMediumUrl(link = '', title = '', guid = '') {
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
  return String(guid).replace(/[^a-z0-9-]+/gi, '-').replace(/^-|-$/g, '') || 'medium-post';
}

function postKey(post) {
  return post.guid || post.slug || post.link;
}

function mergePosts(...lists) {
  const byKey = new Map();
  for (const list of lists) {
    for (const post of list) {
      const key = postKey(post);
      if (!key) continue;
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, post);
        continue;
      }
      byKey.set(key, {
        ...existing,
        ...post,
        categories: post.categories?.length ? post.categories : existing.categories,
        contentSnippet: post.contentSnippet || existing.contentSnippet,
      });
    }
  }
  return [...byKey.values()].sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
}

function withUniqueSlugs(posts) {
  const used = new Set();
  return posts.map((post) => {
    let slug = post.slug || slugFromMediumUrl(post.link, post.title, post.guid);
    if (used.has(slug)) {
      const suffix = String(post.guid || slug).slice(-8).replace(/[^a-z0-9]/gi, '');
      slug = `${slug}-${suffix || used.size}`;
    }
    used.add(slug);
    return { ...post, slug, link: cleanMediumLink(post.link) };
  });
}

function loadExistingPosts(outputPath) {
  try {
    if (!fs.existsSync(outputPath)) return [];
    const parsed = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function graphql(operationName, query, variables) {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { ...mediumHeaders, 'graphql-operation': operationName },
    body: JSON.stringify({ operationName, query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    const message = json.errors?.map((err) => err.message).join('; ') || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return json.data;
}

async function fetchRssPosts() {
  console.log('Fetching Medium RSS feed...');
  const feed = await parser.parseURL(RSS_URL);
  return (feed.items || []).map((item) => ({
    title: item.title || '',
    link: cleanMediumLink(item.link || ''),
    pubDate: item.pubDate || new Date().toISOString(),
    contentSnippet: item.contentSnippet || '',
    categories: item.categories || [],
    guid: item.guid || item.link || '',
    author: item.creator || AUTHOR,
    slug: slugFromMediumUrl(item.link, item.title, item.guid),
  }));
}

function mapGraphqlPost(post, author) {
  const link = cleanMediumLink(post.mediumUrl || '');
  const id = post.id || '';
  return {
    title: post.title || '',
    link,
    pubDate: post.firstPublishedAt
      ? new Date(post.firstPublishedAt).toISOString()
      : new Date().toISOString(),
    contentSnippet: post.extendedPreviewContent?.subtitle || '',
    categories: (post.tags || [])
      .map((tag) => tag.normalizedTagSlug || tag.id)
      .filter(Boolean),
    guid: id ? `https://medium.com/p/${id}` : link,
    author,
    slug: post.uniqueSlug || slugFromMediumUrl(link, post.title, id),
  };
}

async function fetchGraphqlPosts() {
  console.log('Fetching Medium archive via GraphQL...');
  const userData = await graphql(
    'UserByName',
    `query UserByName($username: ID!) {
      userResult(username: $username) {
        __typename
        ... on User { id username name }
      }
    }`,
    { username: USERNAME }
  );

  const user = userData.userResult;
  if (!user?.id) throw new Error('Medium user not found');

  const query = `query HomepagePosts($id: ID!, $paging: PagingOptions, $includeDistributedResponses: Boolean) {
    user(id: $id) {
      homepagePostsConnection(paging: $paging, includeDistributedResponses: $includeDistributedResponses) {
        posts {
          id
          title
          uniqueSlug
          mediumUrl
          firstPublishedAt
          isPublished
          tags { id normalizedTagSlug }
          extendedPreviewContent { subtitle }
        }
        pagingInfo { next { from limit } }
      }
    }
  }`;

  const posts = [];
  let from;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const data = await graphql('HomepagePosts', query, {
      id: user.id,
      paging: from ? { limit: PAGE_SIZE, from } : { limit: PAGE_SIZE },
      includeDistributedResponses: true,
    });
    const connection = data.user?.homepagePostsConnection;
    const batch = (connection?.posts || []).filter((post) => post?.isPublished !== false);
    posts.push(...batch.map((post) => mapGraphqlPost(post, user.name || AUTHOR)));
    from = connection?.pagingInfo?.next?.from;
    if (!from || batch.length === 0) break;
  }

  console.log(`✓ GraphQL returned ${posts.length} published posts`);
  return posts;
}

async function fetchMediumPosts() {
  const outputDir = path.join(process.cwd(), 'src/content', '_medium');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outputPath = path.join(outputDir, 'posts.json');
  const existing = loadExistingPosts(outputPath);

  let graphqlPosts = [];
  let rssPosts = [];

  try {
    graphqlPosts = await fetchGraphqlPosts();
  } catch (error) {
    console.warn('GraphQL archive fetch failed, falling back to RSS + saved posts:', error.message);
  }

  try {
    rssPosts = await fetchRssPosts();
    console.log(`✓ RSS returned ${rssPosts.length} posts`);
  } catch (error) {
    console.warn('RSS fetch failed:', error.message);
  }

  const posts = withUniqueSlugs(mergePosts(existing, rssPosts, graphqlPosts));
  if (posts.length === 0) {
    throw new Error('No Medium posts could be fetched');
  }

  fs.writeFileSync(outputPath, JSON.stringify(posts, null, 2));
  console.log(`✓ Saved ${posts.length} Medium posts to ${outputPath}`);
}

fetchMediumPosts().catch((error) => {
  console.error('Error fetching Medium posts:', error);
  process.exit(1);
});
