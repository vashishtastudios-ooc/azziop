import { NextResponse, type NextRequest } from "next/server";

import { db } from "~/server/db";
import { publishAllDuePosts } from "~/server/lib/publishAllDuePosts";

export const runtime = "nodejs";
// Don't cache — this endpoint must execute on every invocation.
export const dynamic = "force-dynamic";
// Allow up to 5 minutes in case many users have due posts.
export const maxDuration = 300;

/**
 * Cron endpoint that publishes every scheduled post whose time has arrived,
 * across every user — not just whoever happens to be online.
 *
 * Schedulers that hit this endpoint:
 *   - Local dev:      src/instrumentation.ts runs an in-process timer every 5 min.
 *   - Vercel:         vercel.json -> { crons: [{ path: "/api/cron/publish-due", schedule: "*\/5 * * * *" }] }
 *   - Self-hosted:    any cron/QStash/GitHub Action that can GET/POST this URL.
 *
 * Auth model:
 *   - In production, the caller MUST send `Authorization: Bearer <CRON_SECRET>`.
 *     Vercel Cron does this automatically using the CRON_SECRET env var.
 *   - In development, we also accept `x-vercel-cron: 1` (sent by the
 *     instrumentation hook) so you don't have to configure a secret locally.
 *
 * Both GET and POST are allowed so that every cron provider works out of the box.
 */
async function handle(req: NextRequest) {
  const isAuthorized = checkAuth(req);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  try {
    const result = await publishAllDuePosts(db);
    const elapsedMs = Date.now() - startedAt;
    console.log(
      `[cron:publish-due] ok users=${result.usersProcessed} attempted=${result.attempted} published=${result.published} failed=${result.failed} elapsedMs=${elapsedMs}`,
    );
    return NextResponse.json({ ok: true, elapsedMs, ...result });
  } catch (e) {
    console.error("[cron:publish-due] fatal error", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();

  // Internal trigger from the dev instrumentation hook — only honored when
  // NODE_ENV is NOT production, so a public caller can't spoof it in prod.
  if (
    process.env.NODE_ENV !== "production" &&
    req.headers.get("x-internal-cron") === "1"
  ) {
    return true;
  }

  if (!secret) {
    // No secret configured. Allow only in development; hard-fail in production
    // so we never leave this endpoint publicly triggerable by accident.
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader === `Bearer ${secret}`) return true;

  // Vercel Cron sends this header when CRON_SECRET is set in the project.
  const vercelHeader = req.headers.get("x-vercel-cron");
  if (vercelHeader && authHeader === `Bearer ${secret}`) return true;

  // Also allow ?secret=... for simpler self-hosted setups.
  const urlSecret = new URL(req.url).searchParams.get("secret");
  if (urlSecret && urlSecret === secret) return true;

  return false;
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
