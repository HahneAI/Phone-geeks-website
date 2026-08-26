/**
 * v1 auth for the /management dashboard (see TODO.md §6): one shared
 * password (`MANAGEMENT_PASSWORD` in Vercel), no per-user accounts. On
 * successful login the server signs a cookie so a visitor can't just set
 * their own "logged in" cookie and skip the password — the signature is
 * an HMAC over the expiry using the password itself as the key, so only
 * someone who already knows the password could forge one. Upgrading to
 * real accounts later (Supabase Auth, per TODO.md §6 v2) only touches
 * this file and the login page, nothing downstream.
 *
 * Uses Web Crypto (`crypto.subtle`) instead of Node's `crypto` module so
 * this also works if the route protecting /management ever runs on the
 * Edge runtime, not just Node.
 */

export const MANAGEMENT_COOKIE_NAME = "pg_mgmt_session";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getSecret(): string | null {
  return process.env.MANAGEMENT_PASSWORD || null;
}

export function isManagementConfigured(): boolean {
  return getSecret() !== null;
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  return Buffer.from(signature).toString("base64url");
}

/** Checks a submitted password against `MANAGEMENT_PASSWORD`. */
export function checkPassword(candidate: string): boolean {
  const secret = getSecret();
  return secret !== null && candidate === secret;
}

/** Builds a signed, expiring session token for the management cookie. */
export async function createSessionToken(): Promise<string | null> {
  const secret = getSecret();
  if (!secret) return null;
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const signature = await hmac(secret, String(expiresAt));
  return `${expiresAt}.${signature}`;
}

/** Verifies a session token from the cookie is signed and not expired. */
export async function verifySessionToken(
  token: string | undefined
): Promise<boolean> {
  const secret = getSecret();
  if (!secret || !token) return false;

  const [expiresAtRaw, signature] = token.split(".");
  const expiresAt = Number(expiresAtRaw);
  if (!expiresAtRaw || !signature || Number.isNaN(expiresAt)) return false;
  if (Date.now() > expiresAt) return false;

  const expected = await hmac(secret, expiresAtRaw);
  return expected === signature;
}
