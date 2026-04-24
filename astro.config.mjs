import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
      persist: '.wrangler/state/v3',
    },
  }),
  vite: {
    ssr: {
      external: ['node:crypto'],
    },
  },
});
