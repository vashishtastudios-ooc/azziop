/**
 * In-process cron loop used during local development (and any self-hosted
 * long-running Node.js deployment). It fires the publish-due job every
 * 5 minutes without needing Vercel Cron, Upstash QStash, or a system cron.
 *
 * We call the helper directly instead of making an HTTP request to
 * /api/cron/publish-due because:
 *   1. It's cheaper — no TCP/TLS/middleware hop.
 *   2. It removes the need to configure CRON_SECRET locally.
 *   3. The dev server isn't always reachable from itself (port guessing,
 *      custom hosts, HTTPS proxies, etc.).
 */

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const INITIAL_DELAY_MS = 15 * 1000; // let the dev server finish booting first

// Prevent double-starts across HMR reloads in `next dev`.
declare global {
  var __tatasthuLocalCronStarted: boolean | undefined;
  var __tatasthuLocalCronBusy: boolean | undefined;
}

export function startLocalCronLoop(): void {
  if (globalThis.__tatasthuLocalCronStarted) return;
  globalThis.__tatasthuLocalCronStarted = true;

  console.log(
    "[local-cron] publish-due loop armed (every 5 min, first run in 15s). Set DISABLE_LOCAL_CRON=1 to turn off.",
  );

  const run = async () => {
    if (globalThis.__tatasthuLocalCronBusy) return;
    globalThis.__tatasthuLocalCronBusy = true;
    try {
      const { db } = await import("~/server/db");
      const { publishAllDuePosts } = await import(
        "~/server/lib/publishAllDuePosts"
      );
      const result = await publishAllDuePosts(db);
      if (result.attempted > 0 || result.usersProcessed > 0) {
        console.log(
          `[local-cron] publish-due users=${result.usersProcessed} attempted=${result.attempted} published=${result.published} failed=${result.failed}`,
        );
      }
    } catch (e) {
      console.error("[local-cron] publish-due error", e);
    } finally {
      globalThis.__tatasthuLocalCronBusy = false;
    }
  };

  setTimeout(() => {
    void run();
    setInterval(() => void run(), FIVE_MINUTES_MS);
  }, INITIAL_DELAY_MS);
}
