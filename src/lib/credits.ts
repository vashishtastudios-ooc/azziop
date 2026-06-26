import { randomUUID } from "crypto";
import { db } from "~/server/db";
import { CREDIT_COSTS, type CreditAction } from "~/lib/pricing";

/**
 * Append-only credit ledger.
 *
 * - `User.creditBalance` is a cached value; the sum of CreditLedger rows is the
 *   source of truth (reconcilable).
 * - Grants are idempotent via a unique `sourceId` — webhook retries are no-ops.
 * - Spends are atomic via a conditional decrement — concurrent requests can
 *   never push the balance below zero.
 *
 * Note: MongoDB transactions require a replica set (Atlas provides this).
 */

function isUniqueConstraintError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "P2002"
  );
}

function isWriteConflict(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /write conflict|WriteConflict|TransactionError|please retry/i.test(msg);
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (!isWriteConflict(e)) throw e;
      await new Promise((r) => setTimeout(r, 25 * (i + 1)));
    }
  }
  throw lastError;
}

export async function getBalance(userId: string): Promise<number> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true },
  });
  return user?.creditBalance ?? 0;
}

export type GrantInput = {
  userId: string;
  amount: number;
  reason: string;
  /** Unique idempotency key. Re-applying the same key is a no-op. */
  sourceId: string;
  metadata?: Record<string, unknown>;
};

/** Add credits idempotently. Returns the resulting (or existing) balance. */
export async function grantCredits(input: GrantInput): Promise<number> {
  const { userId, amount, reason, sourceId, metadata } = input;
  if (amount <= 0) return getBalance(userId);

  try {
    return await withRetry(() =>
      db.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { creditBalance: true },
        });
        const balanceAfter = (user?.creditBalance ?? 0) + amount;

        await tx.creditLedger.create({
          data: {
            userId,
            amount,
            reason,
            balanceAfter,
            sourceId,
            metadata: metadata ?? undefined,
          },
        });
        await tx.user.update({
          where: { id: userId },
          data: { creditBalance: balanceAfter },
        });
        return balanceAfter;
      }),
    );
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      // Already granted for this sourceId — idempotent no-op.
      return getBalance(userId);
    }
    throw e;
  }
}

export type SpendResult = {
  ok: boolean;
  balance: number;
};

export type SpendInput = {
  userId: string;
  amount: number;
  reason: string;
  metadata?: Record<string, unknown>;
};

/** Atomically spend credits. Fails (ok=false) if the balance is insufficient. */
export async function spendCredits(input: SpendInput): Promise<SpendResult> {
  const { userId, amount, reason, metadata } = input;
  if (amount <= 0) return { ok: true, balance: await getBalance(userId) };

  return withRetry(() =>
    db.$transaction(async (tx) => {
      const conditional = await tx.user.updateMany({
        where: { id: userId, creditBalance: { gte: amount } },
        data: { creditBalance: { decrement: amount } },
      });

      if (conditional.count === 0) {
        const balance = await getBalance(userId);
        return { ok: false, balance };
      }

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { creditBalance: true },
      });
      const balanceAfter = user?.creditBalance ?? 0;

      await tx.creditLedger.create({
        data: {
          userId,
          amount: -amount,
          reason,
          balanceAfter,
          sourceId: `spend:${randomUUID()}`,
          metadata: metadata ?? undefined,
        },
      });

      return { ok: true, balance: balanceAfter };
    }),
  );
}

export function costForAction(action: CreditAction, count = 1): number {
  return CREDIT_COSTS[action] * Math.max(0, count);
}

/** Convenience: spend credits for a metered action (image, campaign). */
export async function spendForAction(
  userId: string,
  action: CreditAction,
  count = 1,
): Promise<SpendResult> {
  return spendCredits({
    userId,
    amount: costForAction(action, count),
    reason: `spend_${action}`,
    metadata: { action, count },
  });
}

/** Refund credits for a failed metered action (partial or full batch). */
export async function refundForAction(
  userId: string,
  action: CreditAction,
  count = 1,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const amount = costForAction(action, count);
  if (amount <= 0) return;
  await grantCredits({
    userId,
    amount,
    reason: "refund",
    sourceId: `refund:${action}:${randomUUID()}`,
    metadata: { action, count, ...metadata },
  });
}
