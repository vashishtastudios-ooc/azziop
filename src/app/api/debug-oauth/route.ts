import { NextResponse } from "next/server";

import { getCanonicalAuthBaseUrl } from "~/server/auth/baseUrl";

/** Shows the Google OAuth redirect URI your deployment must register. */
export async function GET() {
  const base = getCanonicalAuthBaseUrl();
  const redirectUri = base
    ? `${base}/api/auth/callback/google`
    : "(set NEXTAUTH_URL or AUTH_URL)";

  return NextResponse.json({
    canonicalBase: base ?? null,
    redirectUri,
    hint: "Add redirectUri exactly to Google Cloud → Credentials → OAuth client → Authorized redirect URIs",
  });
}
