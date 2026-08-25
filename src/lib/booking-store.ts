import { Redis } from "@upstash/redis";

/**
 * Persists phone-booked appointments so they can be looked up on /track —
 * this is what makes book_mock_appointment's reference number a *real*,
 * shared record instead of just something logged and forgotten. The two
 * processes (Vapi's server calling this site's API, and a browser loading
 * /track) run as separate requests with no shared memory of their own, so
 * this needs real storage, not a module-level variable.
 *
 * Reads either the Vercel KV marketplace integration's env vars
 * (KV_REST_API_URL/TOKEN) or plain Upstash Redis env vars
 * (UPSTASH_REDIS_REST_URL/TOKEN) — both are Upstash under the hood, this
 * just avoids caring which one was added in the Vercel dashboard.
 *
 * IMPORTANT: neither is provisioned on this project yet. Until one is
 * added (Vercel dashboard → Storage → add the Upstash/KV integration →
 * redeploy so the env vars are injected), this falls back to an in-memory
 * Map so nothing crashes — but that fallback resets on every cold start
 * and isn't shared across serverless instances, so it will NOT reliably
 * make a phone booking show up on /track in production. It's there for
 * local dev only. See TODO.md §5, Tier 1.
 */

export interface PhoneBooking {
  reference: string;
  device: string;
  issue: string;
  locationSlug: string;
  locationName: string;
  callerName: string;
  callbackNumber: string;
  preferredTime?: string;
  createdAt: string;
}

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

if (!redis) {
  console.warn(
    "[booking-store] No Redis configured (KV_REST_API_URL/TOKEN or " +
      "UPSTASH_REDIS_REST_URL/TOKEN). Falling back to an in-memory store " +
      "that will NOT persist in production. Add the Upstash/KV integration " +
      "in the Vercel dashboard and redeploy."
  );
}

// Local-dev-only fallback. Not durable — see warning above.
const memoryStore = new Map<string, PhoneBooking>();

const KEY_PREFIX = "pg:booking:";

function normalizeReference(reference: string): string {
  return reference.trim().toUpperCase();
}

export async function saveBooking(booking: PhoneBooking): Promise<void> {
  const key = normalizeReference(booking.reference);
  if (redis) {
    await redis.set(`${KEY_PREFIX}${key}`, booking);
  } else {
    memoryStore.set(key, booking);
  }
}

export async function getBooking(reference: string): Promise<PhoneBooking | null> {
  const key = normalizeReference(reference);
  if (redis) {
    const result = await redis.get<PhoneBooking>(`${KEY_PREFIX}${key}`);
    return result ?? null;
  }
  return memoryStore.get(key) ?? null;
}

/** True once real (Redis-backed) persistence is configured. */
export function isBookingStoreDurable(): boolean {
  return redis !== null;
}
