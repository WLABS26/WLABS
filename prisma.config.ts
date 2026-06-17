import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a DIRECT (non-pooled) connection: Postgres advisory locks,
    // which `migrate deploy` uses, don't work through Neon's pooler and cause P1002
    // lock-timeout failures during the Vercel build. Prefer DIRECT_URL when set and
    // fall back to DATABASE_URL (e.g. local Postgres, which isn't pooled). The runtime
    // client (src/lib/prisma.ts) keeps using the pooled DATABASE_URL.
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
