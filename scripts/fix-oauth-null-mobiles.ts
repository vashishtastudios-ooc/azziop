/**
 * One-time: assign unique placeholder mobiles to OAuth users that have mobile=null.
 * Run: npx tsx scripts/fix-oauth-null-mobiles.ts
 */
import { PrismaClient } from "@prisma/client";
import { googlePlaceholderMobile } from "../src/server/auth/googleUser";

const db = new PrismaClient();

async function main() {
  const users = await db.user.findMany({
    where: { OR: [{ mobile: null }, { mobile: "" }] },
    select: { id: true, email: true, mobile: true },
  });

  console.log(`Found ${users.length} user(s) without mobile`);

  for (const user of users) {
    if (!user.email?.trim()) {
      console.warn(`Skip ${user.id}: no email`);
      continue;
    }
    const mobile = googlePlaceholderMobile(user.email);
    await db.user.update({
      where: { id: user.id },
      data: { mobile },
    });
    console.log(`Updated ${user.id} -> ${mobile}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
