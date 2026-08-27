import type { Metadata } from "next";
import {
  ExternalLink,
  Eye,
  MessageCircle,
  PhoneCall,
  TicketCheck,
  Users,
} from "lucide-react";
import {
  getBookingsCount,
  isBookingStoreDurable,
  listAttributedCallIds,
  listRecentBookings,
} from "@/lib/booking-store";
import {
  getChatWidgetSummary,
  getWebAnalyticsSummary,
} from "@/lib/vercel-analytics";
import { getCallerSummary } from "@/lib/vapi-analytics";

export const metadata: Metadata = {
  title: "Management | Phone Geeks",
  robots: { index: false, follow: false },
};

// Always read fresh booking data — this page must never be statically
// prerendered with a stale snapshot baked in at build time.
export const dynamic = "force-dynamic";

const LINK_OUTS = [
  {
    label: "Vercel Speed Insights",
    description: "Core Web Vitals — not pulled in here yet.",
    href: "https://vercel.com/dashboard",
  },
  {
    label: "Vapi call logs",
    description: "Phone agent call volume and transcripts.",
    href: "https://dashboard.vapi.ai/",
  },
  {
    label: "Supabase table editor",
    description: "Raw bookings table, if you want to see everything.",
    href: "https://supabase.com/dashboard",
  },
];

const ANALYTICS_ERROR_MESSAGES: Record<string, string> = {
  "not-configured":
    "VERCEL_API_TOKEN isn't set on this deployment yet — create one in Vercel (Account Settings → Tokens) and add it as an env var to pull traffic in here.",
  "not-enabled":
    "Vercel's Web Analytics API returned a 404 just now. This has worked fine before with VERCEL_API_TOKEN set, so if you're seeing this, double-check the token's still valid — it may also just need a minute and a refresh.",
  error: "Couldn't reach Vercel's Analytics API just now.",
};

const CHAT_WIDGET_ERROR_MESSAGES: Record<string, string> = {
  ...ANALYTICS_ERROR_MESSAGES,
  "not-configured":
    "VERCEL_API_TOKEN isn't set yet — same token as the site traffic card above powers this too.",
  error:
    "Couldn't reach Vercel's Analytics API for these events — likely because no one's actually triggered a voice call from the chat widget yet (Vercel may not create the \"events\" dataset until at least one custom event has fired). Try the chat widget's voice mode once, then refresh this page.",
};

const CALLER_ERROR_MESSAGES: Record<string, string> = {
  "not-configured":
    "VAPI_PRIVATE_KEY isn't set on this deployment yet — create one in Vapi (Dashboard → API Keys → Private Key) and add it as an env var. Never the same value as NEXT_PUBLIC_VAPI_PUBLIC_KEY.",
  error: "Couldn't reach Vapi's Calls API just now.",
};

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default async function ManagementPage() {
  const durable = isBookingStoreDurable();
  const [bookingsCount, recentBookings, analytics, chatWidget, bookedCallIds] =
    await Promise.all([
      durable ? getBookingsCount() : Promise.resolve(0),
      durable ? listRecentBookings(10) : Promise.resolve([]),
      getWebAnalyticsSummary(),
      getChatWidgetSummary(),
      durable ? listAttributedCallIds() : Promise.resolve(new Set<string>()),
    ]);
  const callerData = await getCallerSummary(bookedCallIds);

  return (
    <div>
      {!durable ? (
        <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Booking storage is running on the in-memory fallback right now
          (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY aren&rsquo;t set on this
          deployment), so booking numbers below are not real. See TODO.md
          §5 Tier 1.
        </p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-brand-navy">
            <TicketCheck className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Phone bookings (all-time)
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold text-brand-navy">
            {bookingsCount}
          </p>
          <p className="mt-1 text-xs text-black/50">
            Appointments booked through the Vapi phone agent, stored in
            Supabase.
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-brand-navy">
            <PhoneCall className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Call volume (7 days)
            </span>
          </div>
          {callerData.ok ? (
            <>
              <p className="mt-2 text-3xl font-bold text-brand-navy">
                {callerData.data.last7d.totalCalls}
              </p>
              <p className="mt-1 text-xs text-black/50">
                {callerData.data.last7d.webCalls} from the site widgets,{" "}
                {callerData.data.last7d.phoneCalls} to the real number.
              </p>
              <p className="mt-2 text-xs font-semibold text-brand-navy">
                {callerData.data.last7d.bookedCalls} became a real booking
                {callerData.data.last7d.totalCalls > 0
                  ? ` (${Math.round(
                      (callerData.data.last7d.bookedCalls /
                        callerData.data.last7d.totalCalls) *
                        100
                    )}%)`
                  : ""}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-black/60">
              {CALLER_ERROR_MESSAGES[callerData.reason] ?? callerData.message}
            </p>
          )}
          {!durable ? (
            <p className="mt-2 text-xs text-black/40">
              Attribution needs Supabase configured (see the notice above) —
              a call can only match a booking that was actually saved.
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50">
          Site traffic
        </h2>
        {analytics.ok ? (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-brand-navy">
                <Eye className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Visitors / Pageviews
                </span>
              </div>
              <div className="mt-3 flex gap-8">
                <div>
                  <p className="text-2xl font-bold text-brand-navy">
                    {analytics.data.last7d.visitors}
                  </p>
                  <p className="text-xs text-black/50">
                    visitors, last 7 days
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-brand-navy">
                    {analytics.data.last30d.visitors}
                  </p>
                  <p className="text-xs text-black/50">
                    visitors, last 30 days
                  </p>
                </div>
              </div>
              <p className="mt-3 flex items-center gap-1 text-xs text-black/40">
                <Users className="h-3 w-3" />
                {analytics.data.last7d.pageviews} pageviews (7d) &middot;{" "}
                {analytics.data.last30d.pageviews} pageviews (30d)
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-navy">
                Top pages (7 days)
              </span>
              {analytics.data.topPages.length === 0 ? (
                <p className="mt-3 text-sm text-black/50">
                  No page-level data yet.
                </p>
              ) : (
                <ul className="mt-3 space-y-1.5 text-sm">
                  {analytics.data.topPages.map((page) => (
                    <li
                      key={page.path}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="truncate text-black/70">
                        {page.path}
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-brand-navy">
                        {page.pageviews}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {ANALYTICS_ERROR_MESSAGES[analytics.reason] ?? analytics.message}
          </p>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50">
          Caller data
        </h2>
        <p className="mt-1 text-xs text-black/40">
          Every call to the assistant behind both the header &ldquo;Call
          Now&rdquo; widget and the chat widget&rsquo;s voice mode, plus
          calls to the real phone number, from Vapi&rsquo;s own Calls API.
          &ldquo;Web&rdquo; vs &ldquo;phone&rdquo; is Vapi&rsquo;s own call
          type — it can&rsquo;t tell which of the two site widgets started a
          web call.
        </p>
        {callerData.ok ? (
          <>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["Last 7 days", callerData.data.last7d],
                  ["Last 30 days", callerData.data.last30d],
                ] as const
              ).map(([label, period]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-navy">
                    {label}
                  </span>
                  <p className="mt-2 text-3xl font-bold text-brand-navy">
                    {period.totalCalls}
                  </p>
                  <p className="mt-1 text-xs text-black/50">
                    {period.webCalls} web &middot; {period.phoneCalls} phone
                    &middot; avg {formatDuration(period.avgDurationSeconds)}
                    &middot; ${period.totalCost.toFixed(2)}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-brand-navy">
                    {period.bookedCalls} became a booking
                  </p>
                </div>
              ))}
            </div>

            {callerData.data.truncated ? (
              <p className="mt-3 text-xs text-amber-700">
                Fetched the {" "}
                {callerData.data.recentCalls.length > 0 ? "most recent 100" : "latest"}{" "}
                calls and bucketed them by date — call volume has grown past
                what one fetch covers, so 7d/30d totals above may be an
                undercount. See src/lib/vapi-analytics.ts.
              </p>
            ) : null}

            <div className="mt-3 overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-sm">
              {callerData.data.recentCalls.length === 0 ? (
                <p className="px-4 py-3 text-sm text-black/50">
                  No calls yet.
                </p>
              ) : (
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-black/40">
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Started</th>
                      <th className="px-4 py-3 font-medium">Duration</th>
                      <th className="px-4 py-3 font-medium">Ended reason</th>
                      <th className="px-4 py-3 font-medium">Caller</th>
                      <th className="px-4 py-3 font-medium">Cost</th>
                      <th className="px-4 py-3 font-medium">Booked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {callerData.data.recentCalls.map((call) => (
                      <tr
                        key={call.id}
                        className="border-b border-black/5 last:border-0"
                      >
                        <td className="px-4 py-3">{call.type}</td>
                        <td className="px-4 py-3 text-xs text-black/50">
                          {call.startedAt
                            ? new Date(call.startedAt).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {formatDuration(call.durationSeconds)}
                        </td>
                        <td className="px-4 py-3 text-xs text-black/50">
                          {call.endedReason ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-black/50">
                          {call.customerNumber ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-black/50">
                          {call.cost !== null ? `$${call.cost.toFixed(2)}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {call.booked ? (
                            <span className="font-semibold text-green-700">
                              ✓ booked
                            </span>
                          ) : (
                            <span className="text-black/30">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          <p className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {CALLER_ERROR_MESSAGES[callerData.reason] ?? callerData.message}
          </p>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50">
          Chat widget data
        </h2>
        <p className="mt-1 text-xs text-black/40">
          The floating chat+voice widget&rsquo;s voice mode only — its text
          chat isn&rsquo;t tracked yet (see TODO.md §5 Tier 5). Same
          VERCEL_API_TOKEN as site traffic above.
        </p>
        {chatWidget.ok ? (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {(
              [
                ["Last 7 days", chatWidget.data.last7d],
                ["Last 30 days", chatWidget.data.last30d],
              ] as const
            ).map(([label, period]) => (
              <div
                key={label}
                className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-2 text-brand-navy">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    {label}
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold text-brand-navy">
                  {period.connected}
                </p>
                <p className="mt-1 text-xs text-black/50">
                  voice calls started from the chat widget
                </p>
                <p className="mt-2 text-xs text-black/40">
                  {period.ended} ended normally &middot; {period.failed}{" "}
                  failed
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {CHAT_WIDGET_ERROR_MESSAGES[chatWidget.reason] ?? chatWidget.message}
          </p>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50">
          Recent bookings
        </h2>
        {recentBookings.length === 0 ? (
          <p className="mt-3 text-sm text-black/50">
            {durable
              ? "No bookings yet."
              : "Bookings aren't persisted on this deployment yet."}
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-black/40">
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Device / Issue</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Caller</th>
                  <th className="px-4 py-3 font-medium">Booked</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr
                    key={booking.reference}
                    className="border-b border-black/5 last:border-0"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-brand-navy">
                      {booking.reference}
                    </td>
                    <td className="px-4 py-3">
                      {booking.device} — {booking.issue}
                    </td>
                    <td className="px-4 py-3">{booking.locationName}</td>
                    <td className="px-4 py-3">
                      {booking.callerName}
                      <span className="block text-xs text-black/40">
                        {booking.callbackNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-black/50">
                      {new Date(booking.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50">
          Elsewhere
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {LINK_OUTS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-black/10 bg-white p-4 text-sm shadow-sm transition hover:border-brand-blue/40"
            >
              <div className="flex items-center justify-between gap-2 font-semibold text-brand-navy">
                {item.label}
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-black/30" />
              </div>
              <p className="mt-1 text-xs text-black/50">
                {item.description}
              </p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
