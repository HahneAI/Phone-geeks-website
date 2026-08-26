import type { Metadata } from "next";
import {
  ExternalLink,
  Eye,
  LogOut,
  PhoneCall,
  TicketCheck,
  Users,
} from "lucide-react";
import {
  getBookingsCount,
  isBookingStoreDurable,
  listRecentBookings,
} from "@/lib/booking-store";
import { getWebAnalyticsSummary } from "@/lib/vercel-analytics";
import { logout } from "@/app/management/actions";

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
    "Web Analytics isn't enabled for this project yet — turn it on in Vercel (Project → Analytics → Enable), then this fills in automatically.",
  error: "Couldn't reach Vercel's Analytics API just now.",
};

export default async function ManagementPage() {
  const durable = isBookingStoreDurable();
  const [bookingsCount, recentBookings, analytics] = await Promise.all([
    durable ? getBookingsCount() : Promise.resolve(0),
    durable ? listRecentBookings(10) : Promise.resolve([]),
    getWebAnalyticsSummary(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Management</h1>
          <p className="mt-1 text-sm text-black/60">
            v1 — shared-password gate, straight reads. Not indexed, not
            linked from anywhere public.
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg border border-black/15 px-3 py-1.5 text-sm font-medium text-black/70 transition hover:border-black/30 hover:text-black"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>

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
              Call volume & attribution
            </span>
          </div>
          <p className="mt-2 text-sm text-black/60">
            Not tracked yet — needs the lead-capture logging from TODO.md §5
            Tier 1. For now, see Vapi&rsquo;s own call logs (link below).
          </p>
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
