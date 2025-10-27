import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  prerender: true,
  site: 'https://ertugrulkra.github.io',
  base: '/',
  trailingSlash: 'never',
  integrations: [tailwind()],
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

