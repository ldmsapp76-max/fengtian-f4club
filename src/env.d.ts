/// <reference types="astro/client" />

type Runtime = import('@astrojs/cloudflare').Runtime<{
  DB: D1Database;
  SESSIONS: KVNamespace;
  IMAGES: R2Bucket;
}>;

declare namespace App {
  interface Locals extends Runtime {
    user?: {
      id: number;
      nickname: string;
      role: string;
      avatar_emoji: string;
    };
  }
}
