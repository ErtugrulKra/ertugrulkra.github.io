import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'static',
  prerender: true,
  site: 'https://blog.ertugrulkara.com',
  base: '/',
  trailingSlash: 'never',
  integrations: [tailwind({ applyBaseStyles: false })],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
  redirects: {
    '/en': '/',
    '/en/about': '/about',
    '/en/blog': '/blog',
    '/en/blog/[...slug]': '/blog/[...slug]',
    '/en/tags/[tag]': '/tags/[tag]',
  },
  build: {
    assets: 'assets',
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
  },
});
