import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import lunr from 'lunr';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildSearchIndex() {
  try {
    console.log('Building search index...');
    
    // Read post files
    const postsDir = path.join(__dirname, '../src/content');
    const enPostsDir = path.join(postsDir, 'en-posts');
    const trPostsDir = path.join(postsDir, 'tr-posts');
    
    let posts = [];
    
    // Read EN posts
    if (fs.existsSync(enPostsDir)) {
      const enFiles = fs.readdirSync(enPostsDir).filter(f => f.endsWith('.md') && !f.startsWith('_'));
      posts.push(...enFiles.map(file => {
        const filePath = path.join(enPostsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const slug = path.basename(file, '.md');
        const frontmatter = extractFrontmatter(content);
        if (frontmatter.draft === true || frontmatter.draft === 'true') return null;
        return {
          id: `en:${slug}`,
          slug,
          title: frontmatter.title || '',
          description: frontmatter.description || '',
          content: removeFrontmatter(content).substring(0, 500),
          tags: frontmatter.tags || [],
          lang: 'en',
          date: frontmatter.pubDate || new Date().toISOString(),
        };
      }).filter(Boolean));
    }
    
    // Read TR posts
    if (fs.existsSync(trPostsDir)) {
      const trFiles = fs.readdirSync(trPostsDir).filter(f => f.endsWith('.md') && !f.startsWith('_'));
      posts.push(...trFiles.map(file => {
        const filePath = path.join(trPostsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const slug = path.basename(file, '.md');
        const frontmatter = extractFrontmatter(content);
        if (frontmatter.draft === true || frontmatter.draft === 'true') return null;
        return {
          id: `tr:${slug}`,
          slug,
          title: frontmatter.title || '',
          description: frontmatter.description || '',
          content: removeFrontmatter(content).substring(0, 500),
          tags: frontmatter.tags || [],
          lang: 'tr',
          date: frontmatter.pubDate || new Date().toISOString(),
        };
      }).filter(Boolean));
    }
    
    // Read Medium summaries (title/slug only — full article body stays on Medium)
    const mediumPath = path.join(postsDir, '_medium', 'posts.json');
    if (fs.existsSync(mediumPath)) {
      try {
        const mediumPosts = JSON.parse(fs.readFileSync(mediumPath, 'utf-8'));
        const summariesPath = path.join(__dirname, '../src/data/medium-summaries.json');
        let summaries = {};
        if (fs.existsSync(summariesPath)) {
          try {
            summaries = JSON.parse(fs.readFileSync(summariesPath, 'utf-8'));
          } catch {
            summaries = {};
          }
        }

        for (const item of mediumPosts) {
          const snippet = item.contentSnippet || '';
          posts.push({
            id: `en:${item.slug}`,
            slug: item.slug,
            title: item.title || '',
            description: summaries[item.slug]?.en || snippet,
            content: summaries[item.slug]?.en || snippet,
            tags: item.categories || [],
            lang: 'en',
            date: item.pubDate || new Date().toISOString(),
          });
          posts.push({
            id: `tr:${item.slug}`,
            slug: item.slug,
            title: item.title || '',
            description: summaries[item.slug]?.tr || snippet,
            content: summaries[item.slug]?.tr || snippet,
            tags: item.categories || [],
            lang: 'tr',
            date: item.pubDate || new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Could not index Medium posts:', error);
      }
    }

    const idx = lunr(function () {
      this.ref('id');
      this.field('title', { boost: 10 });
      this.field('description', { boost: 5 });
      this.field('content');
      this.field('tags', { boost: 3 });
      
      posts.forEach((post) => {
        this.add(post);
      });
    });
    
    // Create output directory
    const outputDir = path.join(__dirname, '../public');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write index and posts to JSON
    const output = {
      index: idx.toJSON(),
      posts: posts.map(p => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        description: p.description,
        lang: p.lang,
        tags: p.tags,
      })),
    };
    
    fs.writeFileSync(
      path.join(outputDir, 'search-index.json'),
      JSON.stringify(output, null, 2)
    );
    
    console.log(`✓ Built search index for ${posts.length} posts`);
  } catch (error) {
    console.error('Error building search index:', error);
    process.exit(1);
  }
}

function extractFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!match) return {};
  
  const frontmatter = {};
  match[1].split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return;
    
    const key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();
    
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    // Handle arrays
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''));
      frontmatter[key] = value;
    } else {
      // Try to parse as date
      if (key === 'pubDate' || key === 'date') {
        frontmatter[key] = new Date(value).toISOString();
      } else {
        frontmatter[key] = value;
      }
    }
  });
  
  return frontmatter;
}

function removeFrontmatter(content) {
  return content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
}

buildSearchIndex();

