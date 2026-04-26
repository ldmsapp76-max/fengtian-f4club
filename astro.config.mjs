import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  devToolbar: { enabled: false },
  adapter: cloudflare({
    sessionKVBindingName: 'SESSIONS',
    platformProxy: {
      enabled: true,
      persist: '.wrangler/state',
    },
  }),
  vite: {
    ssr: {
      external: ['node:crypto'],
    },
  },
});
