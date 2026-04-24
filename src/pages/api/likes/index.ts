// 奉天F4Club — Likes API
import type { APIRoute } from 'astro';
import { toggleLike, getLikeCount } from '../../../lib/db';

export const POST: APIRoute = async ({ request, locals }) => {
  const user = (locals as any).user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const runtime = (locals as any).runtime;
  const { DB } = runtime.env;

  try {
    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return new Response(JSON.stringify({ error: 'Missing postId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const liked = await toggleLike(DB, Number(postId), user.id);
    const count = await getLikeCount(DB, Number(postId));

    return new Response(JSON.stringify({ success: true, liked, count }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
