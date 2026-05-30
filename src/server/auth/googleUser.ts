import { db } from "~/server/db";
import { grantCredits } from "~/lib/credits";
import { monthlyCreditsForPlan } from "~/lib/pricing";

export type GoogleProfileInput = {
  email?: string | null;
  name?: string | null;
  picture?: string | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Placeholder mobile for OAuth-only users (MongoDB @unique allows only one null). */
export function googlePlaceholderMobile(email: string) {
  return `google:${normalizeEmail(email)}`;
}

/**
 * Find an existing user by email (account linking) or create a new OAuth-only user.
 */
export async function resolveGoogleSignIn(profile: GoogleProfileInput) {
  const rawEmail = profile.email?.trim();
  if (!rawEmail) return null;

  const email = normalizeEmail(rawEmail);
  const avatarUrl = profile.picture ?? undefined;
  const name =
    profile.name?.trim() || email.split("@")[0] || "User";

  let user = await db.user.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
    },
  });

  if (user && user.email !== email) {
    user = await db.user.update({
      where: { id: user.id },
      data: { email },
    });
  }

  if (user) {
    const updates: { avatarUrl?: string; name?: string; mobile?: string } = {};
    if (avatarUrl && !user.avatarUrl) updates.avatarUrl = avatarUrl;
    if (!user.name?.trim()) updates.name = name;
    if (!user.mobile?.trim()) updates.mobile = googlePlaceholderMobile(email);
    if (Object.keys(updates).length > 0) {
      user = await db.user.update({
        where: { id: user.id },
        data: updates,
      });
    }
    return user;
  }

  try {
    const created = await db.user.create({
      data: {
        name,
        email,
        avatarUrl,
        passwordHash: null,
        mobile: googlePlaceholderMobile(email),
      },
    });

    // One-time free-trial credits.
    await grantCredits({
      userId: created.id,
      amount: monthlyCreditsForPlan("free"),
      reason: "plan_grant",
      sourceId: `grant:free-signup:${created.id}`,
      metadata: { planId: "free", source: "google" },
    });

    return created;
  } catch (e) {
    const existing = await db.user.findFirst({
      where: {
        OR: [
          { email },
          { mobile: googlePlaceholderMobile(email) },
        ],
      },
    });
    if (existing) return existing;
    throw e;
  }
}
