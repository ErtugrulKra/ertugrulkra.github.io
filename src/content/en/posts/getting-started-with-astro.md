---
title: Getting Started with Astro
description: A comprehensive guide to building static sites with Astro
pubDate: 2024-02-01
tags: [astro, web-development, ssg]
author: Ertugrul Kara
lang: en
---

Astro is a modern static site generator that's perfect for building fast, content-focused websites. In this post, I'll show you how to get started with Astro.

## Why Astro?

Astro combines the best of static site generation with modern JavaScript. Here are some key benefits:

- **Island Architecture**: Only send the JavaScript you need
- **Framework Flexibility**: Use React, Vue, Svelte, or just plain HTML
- **Great Developer Experience**: Hot reloading, TypeScript support, and more
- **Performance**: Built for speed from the ground up

## Installation

```bash
npm create astro@latest my-astro-site
cd my-astro-site
npm install
npm run dev
```

That's it! You now have a running Astro development server.

## Project Structure

A typical Astro project looks like this:

```
src/
├── components/    # Reusable UI components
├── layouts/       # Page layouts
├── pages/         # Routes and pages
└── content/       # Markdown content
```

## Your First Component

Create a new component in `src/components/MyComponent.astro`:

```astro
---
const { name } = Astro.props;
---

<h1>Hello, {name}!</h1>
```

Use it in any page:

```astro
---
import MyComponent from '../components/MyComponent.astro';
---

<MyComponent name="World" />
```

## Content Collections

Astro's content collections let you manage markdown content with type safety:

```bash
npx astro add content
```

Define a schema in `src/content/config.ts`:

```typescript
import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
  }),
});

export const collections = {
  blog: blogCollection,
};
```

## Deployment

Deploy your Astro site anywhere static sites are hosted:

- **Netlify**: Just connect your repo
- **Vercel**: Automatic deployments
- **GitHub Pages**: Perfect for open source projects

## Conclusion

Astro is a powerful tool for building fast, modern websites. Whether you're building a blog, portfolio, or documentation site, Astro has you covered.

Happy building! 🚀

