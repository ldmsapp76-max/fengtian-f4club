// 奉天F4Club — Login API
import type { APIRoute } from 'astro';
import {
  getUserByNickname,
  ensurePasswordsSet,
  updateUserPassword,
} from '../../../lib/db';
import {
  hashPassword,
  verifyPassword,
  createSession,
  setSessionCookie,
} from '../../../lib/auth';

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

    // Ensure default passwords are set (first run) — 每个用户独立随机盐
    await ensurePasswordsSet(DB, '123456');

    const user = await getUserByNickname(DB, nickname);
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { valid, needsUpgrade } = await verifyPassword(
      password,
      user.password_hash,
    );
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Wrong password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 老哈希（SHA-256 + 固定盐）验证通过后，平滑升级为 PBKDF2 新哈希
    if (needsUpgrade) {
      await updateUserPassword(DB, user.id, await hashPassword(password));
    }

    // Create session
    const token = await createSession(SESSIONS, {
      id: user.id,
      nickname: user.nickname,
      role: user.role,
      avatar_emoji: user.avatar_emoji,
    });

    const isSecure = new URL(request.url).protocol === 'https:';

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: user.id, nickname: user.nickname },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': setSessionCookie(token, isSecure),
        },
      },
    );
  } catch (e: any) {
    console.error('Login error:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
