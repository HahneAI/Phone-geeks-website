/**
 * Shared request/response shapes for Vapi custom (server) tools.
 *
 * The wire format for tool-call requests has more than one shape in
 * practice — Vapi's own docs show a flat { id, name, arguments } entry,
 * but live traffic (and most OpenAI-compatible tool-calling APIs it can
 * be configured to mirror) can instead nest it as
 * { id, type: "function", function: { name, arguments } }, with
 * `arguments` as a JSON *string* rather than an object. This file
 * normalizes every variant we've seen so the route handlers never have
 * to think about it — see normalizeToolCall() below. (Caught in testing:
 * coding only against the docs' flat example threw "Cannot destructure
 * property 'item_name' of 'e.arguments' as it is undefined" against a
 * real call, because the live payload didn't put arguments where the
 * docs example did.)
 *
 * What's still fixed across every variant we've seen:
 *   - Vapi POSTs { message: { type: "tool-calls", toolCallList: [...] } }
 *   - The server MUST respond { results: [{ toolCallId, result }] }
 *   - toolCallId must exactly match the request's id, in the same order
 *   - The endpoint MUST return HTTP 200 even on a handled error — any
 *     other status causes Vapi to silently ignore the response and the
 *     call just hangs on that turn.
 */

/** A tool call as it actually arrives — shape not fully trusted. */
interface RawToolCall {
  id: string;
  name?: string;
  arguments?: unknown;
  function?: {
    name?: string;
    arguments?: unknown;
  };
}

export interface VapiRequestBody {
  message?: {
    type?: string;
    toolCallList?: RawToolCall[];
  };
}

/** Normalized shape every route handler actually works with. */
export interface VapiToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

function normalizeArguments(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
    } catch {
      // fall through
    }
  }
  return {};
}

function normalizeToolCall(raw: RawToolCall): VapiToolCall {
  const name = raw.name ?? raw.function?.name ?? "unknown";
  const rawArgs = raw.arguments ?? raw.function?.arguments;
  const args = normalizeArguments(rawArgs);

  if (Object.keys(args).length === 0) {
    // Helps diagnose the next payload-shape surprise without breaking
    // the call — logs, doesn't throw.
    console.warn("[vapi] tool call arrived with no usable arguments", {
      id: raw.id,
      name,
      rawKeys: Object.keys(raw),
    });
  }

  return { id: raw.id, name, arguments: args };
}

export function getToolCalls(body: VapiRequestBody): VapiToolCall[] {
  return (body.message?.toolCallList ?? []).map(normalizeToolCall);
}

export function vapiResults(results: { toolCallId: string; result: unknown }[]) {
  return { results };
}

/**
 * Wraps a route handler so a thrown error still returns HTTP 200 with an
 * error result per tool call, instead of a 500 that Vapi would ignore.
 */
export async function handleVapiTools(
  req: Request,
  handleOne: (call: VapiToolCall) => unknown
): Promise<Response> {
  let calls: VapiToolCall[] = [];
  try {
    const body = (await req.json()) as VapiRequestBody;
    calls = getToolCalls(body);
  } catch {
    return Response.json(vapiResults([]), { status: 200 });
  }

  const results = calls.map((call) => {
    try {
      return { toolCallId: call.id, result: handleOne(call) };
    } catch (err) {
      return {
        toolCallId: call.id,
        result: `Something went wrong looking that up: ${
          err instanceof Error ? err.message : "unknown error"
        }`,
      };
    }
  });

  return Response.json(vapiResults(results), { status: 200 });
}
