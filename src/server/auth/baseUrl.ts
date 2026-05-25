/**
 * Single canonical origin for NextAuth / Google OAuth callbacks.
 * Prevents redirect_uri_mismatch when NEXTAUTH_URL uses http:// in production
 * or when users hit www vs non-www.
 */
export function getCanonicalAuthBaseUrl(): string | undefined {
  // `next dev` always uses localhost for OAuth — avoids NEXTAUTH_URL pointing at
  // production (http://www.azziop.com) while Google only allows https + localhost.
  if (process.env.NODE_ENV === "development") {
    const port = process.env.PORT ?? "3000";
    return `http://localhost:${port}`;
  }

  const raw = (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL)?.trim();
  if (!raw) return undefined;

  let url = raw.replace(/\/+$/, "");

  if (
    process.env.NODE_ENV === "production" &&
    url.toLowerCase().startsWith("http://")
  ) {
    url = `https://${url.slice(7)}`;
  }

  return url;
}

/** Sync AUTH_URL + NEXTAUTH_URL to the same canonical https base in production. */
export function applyCanonicalAuthEnv(): void {
  const base = getCanonicalAuthBaseUrl();
  if (!base) return;
  process.env.AUTH_URL = base;
  process.env.NEXTAUTH_URL = base;
}

export function getCanonicalAuthHost(): string | undefined {
  const base = getCanonicalAuthBaseUrl();
  if (!base) return undefined;
  try {
    return new URL(base).host;
  } catch {
    return undefined;
  }
}
