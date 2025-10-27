import { defineCollection, z } from 'astro:content';

const blogSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  pubDate: z.date(),
  tags: z.array(z.string()).optional(),
  image: z.string().optional(),
  lang: z.string(),
});

const enPosts = defineCollection({
  type: 'content',
  schema: blogSchema,
});

const trPosts = defineCollection({
  type: 'content',
  schema: blogSchema,
});

export const collections = {
  'en-posts': enPosts,
  'tr-posts': trPosts,
};

