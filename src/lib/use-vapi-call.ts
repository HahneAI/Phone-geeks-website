"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type Vapi from "@vapi-ai/web";

/**
 * Client-side wrapper around @vapi-ai/web for the header "Call Now" widget.
 * The SDK touches the DOM/mic at construction time, so it's dynamically
 * imported inside start() rather than statically imported at module scope —
 * that keeps it out of the server-rendered bundle entirely.
 *
 * Env vars needed (Vercel project settings → Environment Variables), both
 * NEXT_PUBLIC_ since the browser calls Vapi directly, same pattern as any
 * client-side API key:
 *   NEXT_PUBLIC_VAPI_PUBLIC_KEY    — Vapi dashboard → API Keys → Public Key
 *   NEXT_PUBLIC_VAPI_ASSISTANT_ID  — the assistant's ID (Assistants page, or
 *                                    the URL when editing it)
 *
 * The public key is meant to be exposed client-side (that's what makes it
 * "public" as opposed to Vapi's server-only private key) — it can only
 * start calls against assistants on this account, not read/modify account
 * data. Until both vars are set, isVoiceAgentConfigured is false and the
 * header falls back to a plain tel: link instead of pretending an AI agent
 * will pick up.
 */

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
const ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

export const isVoiceAgentConfigured = Boolean(PUBLIC_KEY && ASSISTANT_ID);

/**
 * Non-secret diagnostic snapshot of what this build actually has baked in —
 * lets `?debug=1` on the header widget show *why* isVoiceAgentConfigured is
 * false instead of silently falling back, without ever printing the full
 * public key (still not truly secret, but no reason to show it whole).
 */
export const vapiDebugInfo = {
  hasPublicKey: Boolean(PUBLIC_KEY),
  hasAssistantId: Boolean(ASSISTANT_ID),
  publicKeyPreview: PUBLIC_KEY
    ? PUBLIC_KEY.length > 10
      ? `${PUBLIC_KEY.slice(0, 6)}…${PUBLIC_KEY.slice(-4)}`
      : PUBLIC_KEY
    : null,
  assistantId: ASSISTANT_ID ?? null,
};

export type CallStatus = "idle" | "connecting" | "active" | "ended" | "error";

/**
 * One shared instance of this hook lives in SiteHeader and is passed as a
 * prop to every CallWidget trigger point (desktop bar, mobile icon,
 * hamburger menu) — otherwise each would own an independent Vapi session,
 * and tapping two different trigger buttons could start two real,
 * simultaneously-billed calls.
 */
export type VapiCall = ReturnType<typeof useVapiCall>;

export function useVapiCall() {
  const vapiRef = useRef<Vapi | null>(null);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [muted, setMuted] = useState(false);
  const [assistantSpeaking, setAssistantSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Raw error detail for the ?debug=1 panel — the friendly errorMessage
  // above is deliberately vague for real callers, but pinning down why a
  // real call fails (bad key, bad assistant ID, mic permission, network)
  // needs the actual SDK error payload, not a generic sentence.
  const [debugDetail, setDebugDetail] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Lives here (not in the widget component) since this hook is now a
  // single shared instance across every call-trigger point in the header —
  // duplicating the timer per widget would just mean N independent
  // intervals doing the same setElapsed off the same status.
  useEffect(() => {
    if (status !== "active") return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  function describeError(err: unknown): string {
    if (err instanceof Error) return err.message;
    try {
      return JSON.stringify(err, null, 2).slice(0, 500);
    } catch {
      return String(err);
    }
  }

  // Stop the call if the widget unmounts mid-call (e.g. route change).
  useEffect(() => {
    return () => {
      vapiRef.current?.stop();
    };
  }, []);

  const start = useCallback(async () => {
    if (!isVoiceAgentConfigured) {
      setStatus("error");
      setErrorMessage("Our voice assistant isn't set up yet.");
      return;
    }

    setStatus("connecting");
    setErrorMessage(null);
    setDebugDetail(null);
    setElapsed(0);

    try {
      const { default: VapiClient } = await import("@vapi-ai/web");
      const vapi = new VapiClient(PUBLIC_KEY!);
      vapiRef.current = vapi;

      vapi.on("call-start", () => setStatus("active"));
      vapi.on("call-end", () => {
        setStatus("ended");
        setAssistantSpeaking(false);
      });
      vapi.on("speech-start", () => setAssistantSpeaking(true));
      vapi.on("speech-end", () => setAssistantSpeaking(false));
      vapi.on("error", (err) => {
        console.error("[vapi-call] call error", err);
        setStatus("error");
        setErrorMessage("The call dropped unexpectedly.");
        setDebugDetail(describeError(err));
      });

      await vapi.start(ASSISTANT_ID!);
    } catch (err) {
      console.error("[vapi-call] failed to start call", err);
      setStatus("error");
      setErrorMessage(
        "Couldn't start the call — check that your browser has mic access and try again."
      );
      setDebugDetail(describeError(err));
    }
  }, []);

  const stop = useCallback(() => {
    vapiRef.current?.stop();
    vapiRef.current = null;
    setStatus("ended");
    setAssistantSpeaking(false);
  }, []);

  const toggleMute = useCallback(() => {
    const vapi = vapiRef.current;
    if (!vapi) return;
    const next = !vapi.isMuted();
    vapi.setMuted(next);
    setMuted(next);
  }, []);

  const reset = useCallback(() => {
    vapiRef.current = null;
    setStatus("idle");
    setMuted(false);
    setErrorMessage(null);
    setDebugDetail(null);
  }, []);

  return {
    status,
    muted,
    assistantSpeaking,
    errorMessage,
    debugDetail,
    elapsed,
    start,
    stop,
    toggleMute,
    reset,
  };
}
