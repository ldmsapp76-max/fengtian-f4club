// 奉天F4Club — Comments API
import type { APIRoute } from 'astro';
import { createComment, deleteComment, getCommentById } from '../../../lib/db';

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
    const { postId, content } = body;

    if (!postId || !content) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = await createComment(DB, {
      postId: Number(postId),
      authorId: user.id,
      content,
    });

    return new Response(JSON.stringify({ success: true, id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
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
    const { commentId } = body;
    const id = Number(commentId);

    if (!Number.isInteger(id) || id <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid commentId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const comment = await getCommentById(DB, id);
    if (!comment) {
      return new Response(JSON.stringify({ error: 'Comment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (comment.author_id !== user.id && comment.post_author_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await deleteComment(DB, id);

    return new Response(JSON.stringify({ success: true }), {
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
