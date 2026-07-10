import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.microsave.fr',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  integrations: [sitemap()],
  compressHTML: true,
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
