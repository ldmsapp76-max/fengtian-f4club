// 奉天F4Club — Login API
import type { APIRoute } from 'astro';
import { getUserByNickname, ensurePasswordsSet } from '../../../lib/db';
import { hashPassword, verifyPassword, createSession, setSessionCookie } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, locals }) => {
  const runtime = (locals as any).runtime;
  const { DB, SESSIONS } = runtime.env;

  try {
    const body = await request.json();
    const { nickname, password } = body;

    if (!nickname || !password) {
      return new Response(JSON.stringify({ error: 'Missing nickname or password' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Ensure default passwords are set (first run)
    const defaultHash = await hashPassword('123456');
    await ensurePasswordsSet(DB, defaultHash);

    const user = await getUserByNickname(DB, nickname);
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Wrong password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create session
    const token = await createSession(SESSIONS, user.id);

    return new Response(JSON.stringify({ success: true, user: { id: user.id, nickname: user.nickname } }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': setSessionCookie(token),
      },
    });
  } catch (e: any) {
    console.error('Login error:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
