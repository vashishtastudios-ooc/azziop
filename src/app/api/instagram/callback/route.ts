import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/server/auth';
import { db } from '~/server/db';
import {
  exchangeCodeForLongLivedToken,
  getInstagramBusinessAccount,
} from '~/server/lib/instagramMeta';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const errorReason = req.nextUrl.searchParams.get('error_description');

  const fallbackRedirect = new URL('/schedule', req.url);
  if (errorReason) {
    fallbackRedirect.searchParams.set('error', errorReason);
    return NextResponse.redirect(fallbackRedirect);
  }
  if (!code || !state) {
    fallbackRedirect.searchParams.set('error', 'Missing OAuth response');
    return NextResponse.redirect(fallbackRedirect);
  }

  let parsedState: { uid?: string; projectId?: string } = {};
  try {
    parsedState = JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as {
      uid?: string;
      projectId?: string;
    };
  } catch {
    fallbackRedirect.searchParams.set('error', 'Invalid OAuth state');
    return NextResponse.redirect(fallbackRedirect);
  }

  if (parsedState.uid !== session.user.id) {
    fallbackRedirect.searchParams.set('error', 'OAuth state mismatch');
    return NextResponse.redirect(fallbackRedirect);
  }

  const redirectBase = process.env.NEXTAUTH_URL ?? req.nextUrl.origin;
  const redirectUri = `${redirectBase}/api/instagram/callback`;

  try {
    const token = await exchangeCodeForLongLivedToken(code, redirectUri);
    const account = await getInstagramBusinessAccount(token.access_token);

    await db.user.update({
      where: { id: session.user.id },
      data: {
        metaAccessToken: token.access_token,
        metaTokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
        instagramBusinessAccountId: account.igUserId,
        instagramUsername: account.username,
        facebookPageId: account.pageId,
      },
    });

    const successRedirect = new URL('/schedule', req.url);
    if (parsedState.projectId) successRedirect.searchParams.set('projectId', parsedState.projectId);
    successRedirect.searchParams.set('connected', 'instagram');
    return NextResponse.redirect(successRedirect);
  } catch (e) {
    const errRedirect = new URL('/schedule', req.url);
    if (parsedState.projectId) errRedirect.searchParams.set('projectId', parsedState.projectId);
    errRedirect.searchParams.set(
      'error',
      e instanceof Error ? e.message : 'Failed to connect Instagram',
    );
    return NextResponse.redirect(errRedirect);
  }
}
