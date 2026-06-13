import { createHash, createHmac, timingSafeEqual } from "crypto";

/**
 * Admin authentication helpers.
 *
 * Single-admin auth backed by an HMAC-signed session cookie (no external
 * auth provider / database table required for the MVP). Credentials are
 * configured via ADMIN_EMAIL + ADMIN_PASSWORD_HASH (see .env.example and
 * `npm run admin:hash`).
 */

export const ADMIN_SESSION_COOKIE = "wlabs_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, in seconds

export interface SessionPayload {
  email: string;
  exp: number;
}

/** sha256(password + email) hex digest - matches the `npm run admin:hash` helper. */
export function hashPassword(password: string, email: string): string {
  return createHash("sha256").update(password + email).digest("hex");
}

/** Compare two strings for equality without leaking length/content via timing. */
function timingSafeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    // Compare against itself so the operation still takes constant-ish time.
    timingSafeEqual(bufA, bufA);
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}

export function verifyAdminCredentials(email: string, password: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminEmail || !adminPasswordHash) return false;

  const emailMatches = timingSafeEqualStrings(email.trim().toLowerCase(), adminEmail.trim().toLowerCase());
  const candidateHash = hashPassword(password, adminEmail);
  const passwordMatches = timingSafeEqualStrings(candidateHash, adminPasswordHash);

  return emailMatches && passwordMatches;
}

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || "change-me-to-a-long-random-string";
}

function sign(data: string): string {
  return createHmac("sha256", getSessionSecret()).update(data).digest("base64url");
}

/** Create a signed session token: base64url(JSON payload) + "." + HMAC signature. */
export function createSessionToken(email: string): string {
  const payload: SessionPayload = {
    email,
    exp: Date.now() + ADMIN_SESSION_MAX_AGE * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

/** Verify a session token's signature and expiry, returning its payload if valid. */
export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;

  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return null;

  const encoded = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);
  const expectedSignature = sign(encoded);

  const sigA = Buffer.from(signature);
  const sigB = Buffer.from(expectedSignature);
  if (sigA.length !== sigB.length || !timingSafeEqual(sigA, sigB)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    if (typeof payload.email !== "string" || !payload.email) return null;
    return payload;
  } catch {
    return null;
  }
}
