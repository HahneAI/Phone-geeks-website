"use client";

import { useSyncExternalStore } from "react";

/**
 * Coordinates the two independent, real ways to start a real voice call
 * on this site — the header "Call Now" widget (@vapi-ai/web, driven
 * directly by use-vapi-call.ts) and the floating chat widget's voice
 * mode (@vapi-ai/client-sdk-react's packaged <VapiWidget>, which owns
 * its own internal Vapi connection we have no direct handle to).
 * Without this, someone could open both and start two real,
 * independently billed calls against the same assistant at once — the
 * "open product question" flagged in TODO.md §5 Tier 5 when the chat
 * widget shipped.
 *
 * A plain module-level singleton (not React Context) on purpose: the two
 * call surfaces live in unrelated component subtrees (SiteHeader vs. the
 * root layout's floating widget), so a shared module import is simpler
 * than threading a Provider around both. Safe in Next.js's browser
 * runtime — this file only ever executes client-side, and a client
 * bundle has exactly one instance of the module.
 *
 * Two different mechanisms end up enforcing this, since the two SDKs
 * expose different amounts of control:
 *   - Header: `claimCallSlot("header")` gates use-vapi-call.ts's start()
 *     directly — a real, synchronous "can I start?" check before it
 *     touches @vapi-ai/web at all.
 *   - Chat widget: the packaged <VapiWidget> component has no prop or
 *     ref to intercept its internal "start call" button, so instead
 *     vapi-chat-widget.tsx watches useActiveCallSource() and renders
 *     the widget with mode="chat" (no voice button at all) whenever the
 *     header holds the slot — prevention via UI, not interception.
 *     onVoiceStart/onVoiceEnd still claim/release the slot so the
 *     header's own start() correctly refuses while a chat-widget call
 *     is live.
 */

export type CallSource = "header" | "chat-widget";

let activeSource: CallSource | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

/**
 * Claims the shared call slot for `source`. Returns false (and claims
 * nothing) if a *different* source already holds it — the caller should
 * treat that as "a call is already live elsewhere" and refuse to start
 * its own rather than silently proceeding. Re-claiming by the same
 * source that already holds it is a no-op success.
 */
export function claimCallSlot(source: CallSource): boolean {
  if (activeSource !== null && activeSource !== source) return false;
  if (activeSource !== source) {
    activeSource = source;
    emit();
  }
  return true;
}

/**
 * Releases the slot, but only if `source` is the one currently holding
 * it — prevents a stale "my call ended" from one source clobbering the
 * other source's still-active claim (e.g. a delayed cleanup effect).
 */
export function releaseCallSlot(source: CallSource) {
  if (activeSource !== source) return;
  activeSource = null;
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): CallSource | null {
  return activeSource;
}

function getServerSnapshot(): CallSource | null {
  return null;
}

/**
 * The call source currently holding the shared slot, or null if no
 * call is active anywhere on the site right now. Re-renders the
 * subscribing component whenever it changes.
 */
export function useActiveCallSource(): CallSource | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
