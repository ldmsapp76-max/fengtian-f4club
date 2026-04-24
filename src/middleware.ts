// 奉天F4Club — Middleware (Session Resolution)
import { defineMiddleware } from 'astro:middleware';
import { getSessionToken, getSession } from './lib/auth';
import { getUserById } from './lib/db';

export const onRequest = defineMiddleware(async (context, next) => {
  const { locals, request } = context;
  const runtime = (locals as any).runtime;

  // Skip if no runtime (during build)
  if (!runtime?.env) {
    return next();
  }

  const { DB, SESSIONS } = runtime.env;

  // Resolve session → user
  const token = getSessionToken(request);
  if (token && SESSIONS && DB) {
    try {
      const session = await getSession(SESSIONS, token);
      if (session) {
        const user = await getUserById(DB, session.userId);
        if (user) {
          (locals as any).user = {
            id: user.id,
            nickname: user.nickname,
            role: user.role,
            avatar_emoji: user.avatar_emoji,
          };
        }
      }
    } catch (e) {
      // Session resolution failed, continue as guest
      console.error('Session error:', e);
    }
  }

  return next();
});
