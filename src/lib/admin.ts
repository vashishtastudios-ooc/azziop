/**
 * Admin access: DB role === "admin", or email listed in ADMIN_EMAILS
 * (comma-separated). ADMIN_EMAILS is the bootstrap so the first admin
 * does not need a Mongo update.
 */
export function parseAdminEmails(raw?: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminAccount(user: {
  role?: string | null;
  email?: string | null;
}): boolean {
  if (user.role === "admin") return true;
  const email = user.email?.trim().toLowerCase();
  if (!email) return false;
  return parseAdminEmails(process.env.ADMIN_EMAILS).includes(email);
}
