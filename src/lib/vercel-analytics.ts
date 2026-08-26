/**
 * Server-only client for Vercel's Web Analytics REST API — powers the
 * traffic card on /management. One secret needs to be set in Vercel:
 *
 *   VERCEL_API_TOKEN — a personal or team access token with read access
 *   to this project (Vercel Dashboard -> Account Settings -> Tokens ->
 *   Create Token). Never exposed to the browser; only read here,
 *   server-side.
 *
 * `VERCEL_PROJECT_ID` is auto-provided by Vercel at runtime for every
 * deployment, so it isn't something you need to set by hand. The team ID
 * isn't a secret either — it's hardcoded below with an env override in
 * case this ever moves to a different team.
 *
 * IMPORTANT: Web Analytics is its own opt-in toggle per project
 * (Vercel Dashboard -> your project -> Analytics tab -> Enable) —
 * same story as Speed Insights not showing data until enabled. Until
 * that's flipped on, this API 404s with "Web Analytics not found" and
 * getWebAnalyticsSummary() reports that honestly (reason:
 * "not-enabled") instead of silently showing zeroes.
 */

const DEFAULT_TEAM_ID = "team_Q8xxQArDaIZW4h7Mvl2Mis93";
const DEFAULT_PROJECT_ID = "prj_JlzNTPEnR5Izc7hVTGfJuF84Nxfg";

const API_BASE = "https://api.vercel.com/v1/query/web-analytics";

export interface AnalyticsPeriod {
  visitors: number;
  pageviews: number;
}

export interface AnalyticsPage {
  path: string;
  pageviews: number;
}

export interface AnalyticsSummary {
  last7d: AnalyticsPeriod;
  last30d: AnalyticsPeriod;
  topPages: AnalyticsPage[];
}

export type AnalyticsResult =
  | { ok: true; data: AnalyticsSummary }
  | {
      ok: false;
      reason: "not-configured" | "not-enabled" | "error";
      message: string;
    };

type FetchResult =
  | { ok: true; json: Record<string, unknown> }
  | {
      ok: false;
      reason: "not-configured" | "not-enabled" | "error";
      message: string;
    };

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function vercelFetch(
  path: string,
  params: Record<string, string>
): Promise<FetchResult> {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) {
    return {
      ok: false,
      reason: "not-configured",
      message: "VERCEL_API_TOKEN isn't set in this deployment's environment variables.",
    };
  }

  const projectId = process.env.VERCEL_PROJECT_ID || DEFAULT_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID || DEFAULT_TEAM_ID;

  const url = new URL(`${API_BASE}/${path}`);
  url.searchParams.set("projectId", projectId);
  url.searchParams.set("teamId", teamId);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      // Numbers a few minutes stale are fine here; avoids hitting
      // Vercel's API on every /management page load.
      next: { revalidate: 300 },
    });

    if (res.status === 404) {
      return {
        ok: false,
        reason: "not-enabled",
        message: "Web Analytics isn't enabled for this project yet.",
      };
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        reason: "error",
        message: `${res.status} ${body}`.trim(),
      };
    }

    return { ok: true, json: await res.json() };
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getWebAnalyticsSummary(): Promise<AnalyticsResult> {
  const [count7d, count30d] = await Promise.all([
    vercelFetch("visits/count", { since: isoDaysAgo(7), until: today() }),
    vercelFetch("visits/count", { since: isoDaysAgo(30), until: today() }),
  ]);

  if (!count7d.ok) return count7d;
  if (!count30d.ok) return count30d;

  // Top pages is a nice-to-have on top of the two counts above — if it
  // fails for any reason, degrade quietly to an empty list rather than
  // losing the whole card over a bonus feature.
  const top = await vercelFetch("visits/aggregate", {
    since: isoDaysAgo(7),
    until: today(),
    by: "route",
    limit: "5",
  });

  const data7d = count7d.json.data as
    | { pageviews?: number; visitors?: number }
    | undefined;
  const data30d = count30d.json.data as
    | { pageviews?: number; visitors?: number }
    | undefined;

  const topRows = top.ok && Array.isArray(top.json.data) ? top.json.data : [];
  const topPages: AnalyticsPage[] = topRows
    .map((row) => {
      const r = row as Record<string, unknown>;
      return {
        path: String(r.route ?? r.requestPath ?? ""),
        pageviews: Number(r.pageviews ?? r.count ?? 0),
      };
    })
    .filter((p) => p.path !== "");

  return {
    ok: true,
    data: {
      last7d: {
        visitors: data7d?.visitors ?? 0,
        pageviews: data7d?.pageviews ?? 0,
      },
      last30d: {
        visitors: data30d?.visitors ?? 0,
        pageviews: data30d?.pageviews ?? 0,
      },
      topPages,
    },
  };
}

/**
 * Chat widget data — reads the custom events the floating chat+voice
 * widget already fires (`src/components/layout/vapi-chat-widget.tsx`'s
 * onVoiceStart/onVoiceEnd/onError -> @vercel/analytics `track()` calls,
 * tagged `source: "chat_widget"`). Same VERCEL_API_TOKEN / Web Analytics
 * requirement as getWebAnalyticsSummary() above — no separate config.
 *
 * Only covers the widget's *voice* mode, because that's the only thing
 * it currently tracks — its text-chat onMessage callback was
 * deliberately left unwired (undocumented payload shape, see TODO.md
 * §5 Tier 5). So "connected/ended/failed" here means "visitor switched
 * to a voice call from inside the chat widget," not chat messages sent.
 */
export interface ChatWidgetPeriod {
  connected: number;
  ended: number;
  failed: number;
}

export interface ChatWidgetSummary {
  last7d: ChatWidgetPeriod;
  last30d: ChatWidgetPeriod;
}

export type ChatWidgetResult =
  | { ok: true; data: ChatWidgetSummary }
  | {
      ok: false;
      reason: "not-configured" | "not-enabled" | "error";
      message: string;
    };

function countOf(result: FetchResult): number {
  if (!result.ok) return 0;
  const data = result.json.data as { count?: number; pageviews?: number } | undefined;
  return data?.count ?? data?.pageviews ?? 0;
}

async function countChatWidgetEvent(
  eventName: string,
  since: string,
  until: string
): Promise<FetchResult> {
  return vercelFetch("events/count", {
    since,
    until,
    filter: `eventName eq '${eventName}' and eventData/source eq 'chat_widget'`,
  });
}

export async function getChatWidgetSummary(): Promise<ChatWidgetResult> {
  const until = today();
  const since7 = isoDaysAgo(7);
  const since30 = isoDaysAgo(30);

  const [connected7, ended7, failed7, connected30, ended30, failed30] =
    await Promise.all([
      countChatWidgetEvent("voice_call_connected", since7, until),
      countChatWidgetEvent("voice_call_ended", since7, until),
      countChatWidgetEvent("voice_call_failed", since7, until),
      countChatWidgetEvent("voice_call_connected", since30, until),
      countChatWidgetEvent("voice_call_ended", since30, until),
      countChatWidgetEvent("voice_call_failed", since30, until),
    ]);

  const failure = [
    connected7,
    ended7,
    failed7,
    connected30,
    ended30,
    failed30,
  ].find((r) => !r.ok);
  if (failure && !failure.ok) return failure;

  return {
    ok: true,
    data: {
      last7d: {
        connected: countOf(connected7),
        ended: countOf(ended7),
        failed: countOf(failed7),
      },
      last30d: {
        connected: countOf(connected30),
        ended: countOf(ended30),
        failed: countOf(failed30),
      },
    },
  };
}
