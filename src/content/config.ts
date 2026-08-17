import { defineCollection, z } from 'astro:content';

const blogSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  pubDate: z.date(),
  updatedDate: z.date().optional(),
  tags: z.array(z.string()).optional(),
  image: z.string().optional(),
  lang: z.string(),
  draft: z.boolean().optional().default(false),
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
