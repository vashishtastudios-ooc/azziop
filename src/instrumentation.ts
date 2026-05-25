/**
 * Next.js instrumentation hook.
 *
 * Runs exactly once, on the server, when the Next.js process boots
 * (both `next dev` and `next start`). This is where we install an
 * in-process scheduler that fires the publish-due cron every 5 minutes
 * while the app is running locally — no Vercel, no Upstash, no GitHub
 * Action required for dev. On Vercel, `vercel.json` drives the schedule
 * via HTTP instead, and this in-process loop is intentionally disabled
 * (see NEXT_RUNTIME / VERCEL check below) so posts don't publish twice.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // On Vercel, their own cron hits the HTTP endpoint; don't also run the
  // in-process loop or posts could publish twice.
  if (process.env.VERCEL === "1") return;

  // Opt-out switch so you can disable it (e.g. while running tests).
  if (process.env.DISABLE_LOCAL_CRON === "1") return;

  const { startLocalCronLoop } = await import("~/server/lib/localCronLoop");
  startLocalCronLoop();
}
