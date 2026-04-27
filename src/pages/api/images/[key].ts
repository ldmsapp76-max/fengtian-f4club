// 奉天F4Club — Image Serve API (R2)
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, locals }) => {
  const runtime = (locals as any).runtime;
  const IMAGES = runtime?.env?.IMAGES;
  if (!IMAGES) {
    return new Response('Image storage is not configured', { status: 500 });
  }

  const key = params.key;
  if (!key) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const object = await IMAGES.get(key);
    if (!object) {
      return new Response('Not found', { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('ETag', object.etag);

    return new Response(object.body as ReadableStream, { headers });
  } catch (e) {
    return new Response('Error', { status: 500 });
  }
};
