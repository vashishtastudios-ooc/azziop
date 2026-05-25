import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/server/db';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const post = await db.scheduledSocialPost.findUnique({
    where: { id },
    select: { imageUrl: true },
  });
  if (!post?.imageUrl) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (/^https?:\/\//i.test(post.imageUrl)) {
    return NextResponse.redirect(post.imageUrl);
  }

  const match = post.imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    return NextResponse.json({ error: 'Unsupported image payload' }, { status: 400 });
  }

  const mimeType = match[1]!;
  const base64 = match[2]!;
  const bytes = Buffer.from(base64, 'base64');

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=600',
      'Content-Length': String(bytes.length),
    },
  });
}
