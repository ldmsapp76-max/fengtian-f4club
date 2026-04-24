// 奉天F4Club — Logout API
import type { APIRoute } from 'astro';
import { getSessionToken, deleteSession, clearSessionCookie } from '../../../lib/auth';

export const GET: APIRoute = async ({ request, locals, redirect }) => {
  const runtime = (locals as any).runtime;
  const { SESSIONS } = runtime.env;

  const token = getSessionToken(request);
  if (token && SESSIONS) {
    await deleteSession(SESSIONS, token);
  }

  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/',
      'Set-Cookie': clearSessionCookie(),
    },
  });
};
