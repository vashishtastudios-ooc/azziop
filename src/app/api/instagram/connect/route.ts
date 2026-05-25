import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/server/auth';
import { buildMetaOAuthUrl } from '~/server/lib/instagramMeta';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const projectId = req.nextUrl.searchParams.get('projectId') ?? '';
  const redirectBase = process.env.NEXTAUTH_URL ?? req.nextUrl.origin;
  const redirectUri = `${redirectBase}/api/instagram/callback`;
  const state = Buffer.from(
    JSON.stringify({
      uid: session.user.id,
      ts: Date.now(),
      projectId,
    }),
  ).toString('base64url');

  const oauthUrl = buildMetaOAuthUrl(state, redirectUri);
  return NextResponse.redirect(oauthUrl);
}
