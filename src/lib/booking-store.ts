import { createClient } from "@supabase/supabase-js";

/**
 * Persists phone-booked appointments so they can be looked up on /track —
 * this is what makes book_mock_appointment's reference number a *real*,
 * shared record instead of just something logged and forgotten. The two
 * processes (Vapi's server calling this site's API, and a browser loading
 * /track) run as separate requests with no shared memory of their own, so
 * this needs real storage, not a module-level variable.
 *
 * Backed by Supabase (Postgres) rather than a key-value store — same job
 * for this narrow "look up one record by reference number" need, but a
 * real table the owner can open and read in Supabase's dashboard without
 * writing any code, and Supabase's free tier needs no credit card to
 * start. Uses the service-role key since this only ever runs server-side
 * (Next.js Route Handlers) — never expose that key to the browser.
 *
 * Table setup (run once in the Supabase SQL editor):
 *
 *   create table bookings (
 *     reference text primary key,
 *     device text not null,
 *     issue text not null,
 *     location_slug text not null,
 *     location_name text not null,
 *     caller_name text not null,
 *     callback_number text not null,
 *     preferred_time text,
 *     created_at timestamptz not null default now()
 *   );
 *
 * Env vars needed (Vercel project settings → Environment Variables):
 *   SUPABASE_URL              — Project Settings → API → Project URL
 *   SUPABASE_SERVICE_ROLE_KEY — Project Settings → API → service_role key
 *
 * IMPORTANT: neither is configured on this project yet. Until they are,
 * this falls back to an in-memory Map so nothing crashes — but that
 * fallback resets on every cold start and isn't shared across serverless
 * instances, so it will NOT reliably make a phone booking show up on
 * /track in production. It's there for local dev only. See TODO.md §5,
 * Tier 1.
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

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = url && key ? createClient(url, key) : null;

if (!supabase) {
  console.warn(
    "[booking-store] No Supabase configured (SUPABASE_URL / " +
      "SUPABASE_SERVICE_ROLE_KEY). Falling back to an in-memory store " +
      "that will NOT persist in production. Create the `bookings` table " +
      "(see this file's header comment) and set the env vars in Vercel."
  );
}

// Local-dev-only fallback. Not durable — see warning above.
const memoryStore = new Map<string, PhoneBooking>();

function normalizeReference(reference: string): string {
  return reference.trim().toUpperCase();
}

/** snake_case row shape as stored in Postgres. */
interface BookingRow {
  reference: string;
  device: string;
  issue: string;
  location_slug: string;
  location_name: string;
  caller_name: string;
  callback_number: string;
  preferred_time: string | null;
  created_at: string;
}

function toRow(booking: PhoneBooking): BookingRow {
  return {
    reference: normalizeReference(booking.reference),
    device: booking.device,
    issue: booking.issue,
    location_slug: booking.locationSlug,
    location_name: booking.locationName,
    caller_name: booking.callerName,
    callback_number: booking.callbackNumber,
    preferred_time: booking.preferredTime ?? null,
    created_at: booking.createdAt,
  };
}

function fromRow(row: BookingRow): PhoneBooking {
  return {
    reference: row.reference,
    device: row.device,
    issue: row.issue,
    locationSlug: row.location_slug,
    locationName: row.location_name,
    callerName: row.caller_name,
    callbackNumber: row.callback_number,
    preferredTime: row.preferred_time ?? undefined,
    createdAt: row.created_at,
  };
}

export async function saveBooking(booking: PhoneBooking): Promise<void> {
  const key = normalizeReference(booking.reference);
  if (supabase) {
    const { error } = await supabase.from("bookings").insert(toRow(booking));
    if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  } else {
    memoryStore.set(key, booking);
  }
}

export async function getBooking(reference: string): Promise<PhoneBooking | null> {
  const key = normalizeReference(reference);
  if (supabase) {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("reference", key)
      .maybeSingle();
    if (error) throw new Error(`Supabase lookup failed: ${error.message}`);
    return data ? fromRow(data as BookingRow) : null;
  }
  return memoryStore.get(key) ?? null;
}

/** True once real (Supabase-backed) persistence is configured. */
export function isBookingStoreDurable(): boolean {
  return supabase !== null;
}

/** Most recent bookings, newest first — powers the /management dashboard. */
export async function listRecentBookings(
  limit: number
): Promise<PhoneBooking[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`Supabase list failed: ${error.message}`);
    return (data as BookingRow[]).map(fromRow);
  }
  return [...memoryStore.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

/** Total booking count — powers the /management dashboard's stat card. */
export async function getBookingsCount(): Promise<number> {
  if (supabase) {
    const { count, error } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true });
    if (error) throw new Error(`Supabase count failed: ${error.message}`);
    return count ?? 0;
  }
  return memoryStore.size;
}
