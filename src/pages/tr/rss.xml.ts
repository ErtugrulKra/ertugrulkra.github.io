import type { APIRoute } from 'astro';
import { buildRss } from '../../lib/rss';

export const GET: APIRoute = async ({ site }) => {
  const rss = await buildRss('tr', site);
  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
};
