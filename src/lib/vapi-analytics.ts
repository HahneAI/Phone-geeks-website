/**
 * Server-only client for Vapi's Calls API — powers the "Caller data"
 * section on /management. Needs one new secret:
 *
 *   VAPI_PRIVATE_KEY — Vapi Dashboard -> API Keys -> Private Key. This is
 *   NOT the same value as NEXT_PUBLIC_VAPI_PUBLIC_KEY (that one's meant
 *   to be exposed to the browser so it can start calls; this one must
 *   never leave the server — it can read the account's full call data).
 *
 * Reuses the already-public NEXT_PUBLIC_VAPI_ASSISTANT_ID (fine to read
 * server-side too) to scope this to the one assistant the site actually
 * talks to. That's the same assistant behind both the header "Call Now"
 * widget (@vapi-ai/web, src/lib/use-vapi-call.ts) and the floating chat
 * widget's voice mode (@vapi-ai/client-sdk-react,
 * src/components/layout/vapi-chat-widget.tsx) — Vapi doesn't tag a call
 * by which widget started it, but it does tag `type` (e.g. "webCall" vs
 * "inboundPhoneCall"/"outboundPhoneCall"), which is what actually
 * separates a real phone call from a browser-based one below.
 *
 * docs.vapi.ai is blocked from this sandbox (same limitation called out
 * throughout TODO.md §5), so the exact query-parameter names for
 * server-side date-range filtering on Vapi's List Calls endpoint
 * couldn't be verified against the real docs — only against search
 * snippets. Rather than guess at unverified param names and risk a
 * silently-wrong filter, this fetches the most recent `FETCH_LIMIT`
 * calls for the assistant (verified endpoint + Bearer auth pattern) and
 * buckets them into 7d/30d windows here in code instead. Fine for a
 * shop that hasn't launched the number yet; worth switching to
 * server-side date filtering once real call volume can confirm the
 * right param names.
 *
 * getCallerSummary() takes an optional set of "booked" call ids (see
 * booking-store.ts's listAttributedCallIds()) so each call/period can
 * report whether it turned into a real booking — actual lead
 * attribution, not just two side-by-side counts. Pass nothing to get
 * caller data without attribution (bookedCalls always 0).
 */

const CALLS_API = "https://api.vapi.ai/call";
const FETCH_LIMIT = 100;

export interface CallerPeriod {
  totalCalls: number;
  webCalls: number;
  phoneCalls: number;
  totalCost: number;
  avgDurationSeconds: number;
  /** Calls whose id matches a real booking's vapi_call_id — see booking-store.ts. */
  bookedCalls: number;
}

export interface RecentCall {
  id: string;
  type: string;
  startedAt: string | null;
  durationSeconds: number | null;
  endedReason: string | null;
  cost: number | null;
  customerNumber: string | null;
  booked: boolean;
}

export interface CallerSummary {
  last7d: CallerPeriod;
  last30d: CallerPeriod;
  recentCalls: RecentCall[];
  /** True if FETCH_LIMIT calls were returned — 7d/30d totals may be an undercount. */
  truncated: boolean;
}

export type CallerResult =
  | { ok: true; data: CallerSummary }
  | { ok: false; reason: "not-configured" | "error"; message: string };

interface RawCall {
  id?: string;
  type?: string;
  startedAt?: string;
  createdAt?: string;
  endedAt?: string;
  endedReason?: string;
  cost?: number;
  customer?: { number?: string };
}

function toTimestamp(call: RawCall): number | null {
  const raw = call.startedAt ?? call.createdAt;
  if (!raw) return null;
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? null : t;
}

function durationSeconds(call: RawCall): number | null {
  const start = call.startedAt ?? call.createdAt;
  if (!start || !call.endedAt) return null;
  const ms = new Date(call.endedAt).getTime() - new Date(start).getTime();
  return ms > 0 ? Math.round(ms / 1000) : null;
}

function isPhoneCall(call: RawCall): boolean {
  return (call.type ?? "").toLowerCase().includes("phonecall");
}

function summarizePeriod(
  calls: RawCall[],
  bookedCallIds: Set<string>
): CallerPeriod {
  const totalCalls = calls.length;
  const webCalls = calls.filter((c) => !isPhoneCall(c)).length;
  const phoneCalls = totalCalls - webCalls;
  const totalCost = calls.reduce((sum, c) => sum + (c.cost ?? 0), 0);
  const durations = calls
    .map(durationSeconds)
    .filter((d): d is number => d !== null);
  const avgDurationSeconds =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;
  const bookedCalls = calls.filter(
    (c) => c.id && bookedCallIds.has(c.id)
  ).length;

  return {
    totalCalls,
    webCalls,
    phoneCalls,
    totalCost,
    avgDurationSeconds,
    bookedCalls,
  };
}

function extractCalls(json: unknown): RawCall[] {
  if (Array.isArray(json)) return json as RawCall[];
  const obj = json as Record<string, unknown> | null;
  if (obj && Array.isArray(obj.data)) return obj.data as RawCall[];
  if (obj && Array.isArray(obj.results)) return obj.results as RawCall[];
  return [];
}

export async function getCallerSummary(
  bookedCallIds: Set<string> = new Set()
): Promise<CallerResult> {
  const token = process.env.VAPI_PRIVATE_KEY;
  if (!token) {
    return {
      ok: false,
      reason: "not-configured",
      message:
        "VAPI_PRIVATE_KEY isn't set in this deployment's environment variables.",
    };
  }

  const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
  const url = new URL(CALLS_API);
  url.searchParams.set("limit", String(FETCH_LIMIT));
  if (assistantId) url.searchParams.set("assistantId", assistantId);

  let json: unknown;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      // A few minutes stale is fine; avoids hitting Vapi's API on every
      // /management page load.
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, reason: "error", message: `${res.status} ${body}`.trim() };
    }
    json = await res.json();
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }

  const calls = extractCalls(json);
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const withTimestamps = calls
    .map((call) => ({ call, ts: toTimestamp(call) }))
    .filter((c): c is { call: RawCall; ts: number } => c.ts !== null)
    .sort((a, b) => b.ts - a.ts);

  const last7d = withTimestamps
    .filter((c) => c.ts >= sevenDaysAgo)
    .map((c) => c.call);
  const last30d = withTimestamps
    .filter((c) => c.ts >= thirtyDaysAgo)
    .map((c) => c.call);

  const recentCalls: RecentCall[] = withTimestamps.slice(0, 10).map(({ call }) => ({
    id: call.id ?? "?",
    type: call.type ?? "unknown",
    startedAt: call.startedAt ?? call.createdAt ?? null,
    durationSeconds: durationSeconds(call),
    endedReason: call.endedReason ?? null,
    cost: call.cost ?? null,
    customerNumber: call.customer?.number ?? null,
    booked: Boolean(call.id && bookedCallIds.has(call.id)),
  }));

  return {
    ok: true,
    data: {
      last7d: summarizePeriod(last7d, bookedCallIds),
      last30d: summarizePeriod(last30d, bookedCallIds),
      recentCalls,
      truncated: calls.length >= FETCH_LIMIT,
    },
  };
}
