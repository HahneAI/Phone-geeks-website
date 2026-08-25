/**
 * Shared request/response shapes for Vapi custom (server) tools.
 *
 * Confirmed against Vapi's current docs (fern/tools/custom-tools.mdx):
 *   - Vapi POSTs { message: { type: "tool-calls", toolCallList: [...] } }
 *   - Each entry is { id, name, arguments }
 *   - The server MUST respond { results: [{ toolCallId, result }] }
 *   - toolCallId must exactly match the request's id, in the same order
 *   - The endpoint MUST return HTTP 200 even on a handled error — any
 *     other status causes Vapi to silently ignore the response and the
 *     call just hangs on that turn.
 */

export interface VapiToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface VapiRequestBody {
  message?: {
    type?: string;
    toolCallList?: VapiToolCall[];
  };
}

export function getToolCalls(body: VapiRequestBody): VapiToolCall[] {
  return body.message?.toolCallList ?? [];
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
