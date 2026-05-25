import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCanonicalAuthHost } from "~/server/auth/baseUrl";

/**
 * In production, always serve the app on the host from NEXTAUTH_URL / AUTH_URL
 * so Google OAuth redirect_uri stays consistent (www vs apex).
 */
export function middleware(req: NextRequest) {
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  const canonicalHost = getCanonicalAuthHost();
  if (!canonicalHost) {
    return NextResponse.next();
  }

  const requestHost = req.headers.get("host")?.split(":")[0];
  if (!requestHost || requestHost === canonicalHost) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.protocol = "https:";
  url.host = canonicalHost;
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
