import { db } from "~/server/db";

export type GoogleProfileInput = {
  email?: string | null;
  name?: string | null;
  picture?: string | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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
    const updates: { avatarUrl?: string; name?: string } = {};
    if (avatarUrl && !user.avatarUrl) updates.avatarUrl = avatarUrl;
    if (!user.name?.trim()) updates.name = name;
    if (Object.keys(updates).length > 0) {
      user = await db.user.update({
        where: { id: user.id },
        data: updates,
      });
    }
    return user;
  }

  return db.user.create({
    data: {
      name,
      email,
      avatarUrl,
      passwordHash: null,
      mobile: null,
    },
  });
}
