import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://ertugrulkara.com',
  base: '/',
  trailingSlash: 'always',
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

