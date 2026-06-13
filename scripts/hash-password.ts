/**
 * Generate an ADMIN_PASSWORD_HASH value for .env.
 * Usage: npm run admin:hash -- <password>
 */
import "dotenv/config";

import { hashPassword } from "@/lib/auth";

const password = process.argv[2];

if (!password) {
  console.error("Usage: npm run admin:hash -- <password>");
  process.exit(1);
}

const adminEmail = process.env.ADMIN_EMAIL;

if (!adminEmail) {
  console.error("ADMIN_EMAIL is not set. Add it to .env first.");
  process.exit(1);
}

console.log(hashPassword(password, adminEmail));
