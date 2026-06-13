import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma Client singleton (Prisma 7 driver-adapter pattern).
 *
 * DATABASE_URL is optional at build/import time - the adapter only opens
 * connections lazily when a query actually runs. This lets the app build
 * and the marketing pages render even before a database is configured.
 */

declare global {
  var __prisma__: PrismaClient | undefined;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalThis.__prisma__ ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma__ = prisma;
}
