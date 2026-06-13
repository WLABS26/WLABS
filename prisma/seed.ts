/**
 * WLABS database seed script.
 * Run with `npm run db:seed` (requires DATABASE_URL to be configured and migrated).
 *
 * Populated in full as part of Phase 2 (mock leads, suppression list, etc.).
 */
import { prisma } from "@/lib/prisma";

async function main() {
  console.log("WLABS seed: nothing to do yet (see prisma/seed.ts).");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
