import fs from 'fs';
import path from 'path';
import Parser from 'rss-parser';

const parser = new Parser();

async function fetchMediumPosts() {
  try {
    console.log('Fetching Medium RSS feed...');
    const feed = await parser.parseURL('https://medium.com/feed/@ertugrulkra');
    
    const posts = feed.items.map((item) => ({
      title: item.title || '',
      link: item.link || '',
      pubDate: item.pubDate || new Date().toISOString(),
      contentSnippet: item.contentSnippet || '',
      categories: item.categories || [],
      guid: item.guid || item.link || '',
      author: item.creator || 'Ertugrul Kara',
    }));

    // Create directory if it doesn't exist
    const outputDir = path.join(process.cwd(), 'src/content', '_medium');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write posts to JSON
    const outputPath = path.join(outputDir, 'posts.json');
    fs.writeFileSync(outputPath, JSON.stringify(posts, null, 2));
    
    console.log(`✓ Fetched ${posts.length} Medium posts`);
    console.log(`✓ Saved to ${outputPath}`);
  } catch (error) {
    console.error('Error fetching Medium RSS:', error);
    process.exit(1);
  }
}

fetchMediumPosts();

