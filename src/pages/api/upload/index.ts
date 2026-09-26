// 奉天F4Club — Image Upload API (R2)
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  const user = (locals as any).user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const runtime = (locals as any).runtime;
  const IMAGES = runtime?.env?.IMAGES;
  if (!IMAGES) {
    return new Response(
      JSON.stringify({
        error: 'Image storage is not configured. Please bind an R2 bucket named IMAGES in Cloudflare.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file type.
    // 注意：不允许 SVG —— SVG 可内嵌 JavaScript，存进 R2 后会被当图片直接 serving，
    // 造成存储型 XSS。只保留光栅格式。
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Invalid file type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File too large (max 10MB)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate unique key
    const ext = file.name.split('.').pop() || 'jpg';
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await IMAGES.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    const url = `/api/images/${key}`;

    return new Response(JSON.stringify({ success: true, url, key }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('Upload error:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
