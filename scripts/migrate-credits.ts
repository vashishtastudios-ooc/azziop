/**
 * One-time migration to the credit-ledger model.
 *   1. Converts legacy `bonusImageCredits` into `creditBalance` + a ledger row.
 *   2. Grants the one-time Free allotment to users who have never had credits.
 *
 * Idempotent — safe to run multiple times (ledger rows are keyed by sourceId).
 * Run: npx tsx scripts/migrate-credits.ts
 */
import { PrismaClient } from "@prisma/client";
import { monthlyCreditsForPlan, CREDIT_COSTS } from "../src/lib/pricing";

const db = new PrismaClient();
const FREE_CREDITS = monthlyCreditsForPlan("free");

async function grant(
  userId: string,
  amount: number,
  reason: string,
  sourceId: string,
) {
  if (amount <= 0) return;
  try {
    await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { creditBalance: true },
      });
      const balanceAfter = (user?.creditBalance ?? 0) + amount;
      await tx.creditLedger.create({
        data: { userId, amount, reason, balanceAfter, sourceId },
      });
      await tx.user.update({
        where: { id: userId },
        data: { creditBalance: balanceAfter },
      });
    });
    console.log(`  +${amount} (${reason}) -> ${userId}`);
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      console.log(`  skip ${reason} for ${userId} (already applied)`);
    } else {
      throw e;
    }
  }
}

async function main() {
  const users = await db.user.findMany({
    select: { id: true, bonusImageCredits: true, creditBalance: true },
  });
  console.log(`Migrating ${users.length} users...`);

  for (const user of users) {
    // Legacy bonus *image* credits → credits (1 image = CREDIT_COSTS.image credits).
    if (user.bonusImageCredits > 0) {
      await grant(
        user.id,
        user.bonusImageCredits * CREDIT_COSTS.image,
        "migration",
        `migration:bonus:${user.id}`,
      );
    }

    // Give existing users their free allotment once.
    await grant(
      user.id,
      FREE_CREDITS,
      "plan_grant",
      `grant:free-signup:${user.id}`,
    );
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
