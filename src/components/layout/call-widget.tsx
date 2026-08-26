"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Phone, PhoneOff, Mic, MicOff, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVapiCall, isVoiceAgentConfigured, vapiDebugInfo } from "@/lib/use-vapi-call";
import { LOCATIONS } from "@/lib/locations";

const PRIMARY_LOCATION = LOCATIONS[0];

function telHref(phone: string) {
  return `tel:+1${phone.replace(/\D/g, "")}`;
}

function formatElapsed(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function noopSubscribe() {
  return () => {};
}

/** True only once mounted on the client — document.body isn't available for
 * createPortal during SSR, and this avoids a setState-in-effect for it. */
function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

/**
 * TEMPORARY debug aid — visit the site with ?debug=1 to swap the "not
 * configured" fallback (the plain tel: link) for a diagnostic panel showing
 * exactly what this deployed build has baked in for the two Vapi env vars.
 * Only reacts once mounted, so it never differs between server and client
 * render and never needs a setState-in-effect. Safe to remove once the env
 * var mismatch is resolved.
 */
function useDebugMode() {
  const mounted = useMounted();
  if (!mounted) return false;
  return new URLSearchParams(window.location.search).get("debug") === "1";
}

interface CallWidgetProps {
  className?: string;
  buttonClassName?: string;
}

export function CallWidget({ className, buttonClassName }: CallWidgetProps) {
  const [open, setOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const mounted = useMounted();
  const debugMode = useDebugMode();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { status, muted, assistantSpeaking, errorMessage, start, stop, toggleMute, reset } =
    useVapiCall();

  useEffect(() => {
    if (status !== "active") return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  function handleStart() {
    setElapsed(0);
    start();
  }

  // The panel is portaled to <body> (position: fixed) rather than nested
  // under the button, since the mobile menu it can live inside uses
  // overflow-hidden for its collapse animation and would otherwise clip it.
  useEffect(() => {
    if (!open) return;

    function updateCoords() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCoords({ top: rect.bottom + 12, right: window.innerWidth - rect.right });
    }
    updateCoords();

    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        rootRef.current &&
        !rootRef.current.contains(target) &&
        panelRef.current &&
        !panelRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords, true);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [open]);

  // No public key / assistant ID set yet — an honest plain phone link
  // instead of a widget that implies an AI agent will pick up. With
  // ?debug=1, show the diagnostic panel instead (see useDebugMode above) —
  // TEMPORARY, remove once the env var mismatch is found.
  if (!isVoiceAgentConfigured) {
    if (debugMode) {
      return (
        <div className={cn("relative h-9", className)}>
          <span className="inline-flex h-9 items-center rounded-full border border-amber-300/60 bg-amber-500/10 px-4 text-xs font-semibold text-amber-100">
            ⚠ Voice agent debug
          </span>
          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-amber-400 bg-amber-50 px-4 py-3 text-xs text-amber-900 shadow-xl">
            <p className="font-semibold">Voice agent not detected in this build</p>
            <p className="mt-1.5">
              <span className="font-mono">NEXT_PUBLIC_VAPI_PUBLIC_KEY</span>:{" "}
              {vapiDebugInfo.hasPublicKey ? vapiDebugInfo.publicKeyPreview : "❌ missing"}
            </p>
            <p className="mt-1">
              <span className="font-mono">NEXT_PUBLIC_VAPI_ASSISTANT_ID</span>:{" "}
              {vapiDebugInfo.hasAssistantId ? vapiDebugInfo.assistantId : "❌ missing"}
            </p>
            <p className="mt-1.5 text-amber-700">
              If both show a value here but the widget still didn&rsquo;t
              switch on, this build predates the env var change — trigger a
              fresh deploy.
            </p>
          </div>
        </div>
      );
    }
    return (
      <a
        href={telHref(PRIMARY_LOCATION.phone)}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-full border border-white/30 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10",
          buttonClassName
        )}
      >
        <Phone className="h-4 w-4" />
        {PRIMARY_LOCATION.phone}
      </a>
    );
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative inline-flex h-9 items-center gap-2 rounded-full border border-white/30 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10",
          buttonClassName
        )}
      >
        <Phone className="h-4 w-4" />
        Call Now
        {status === "active" && !open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
        )}
      </button>

      {open && mounted && createPortal(
        <div
          ref={panelRef}
          style={{ top: coords.top, right: coords.right }}
          className="fixed z-50 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-border bg-white p-5 text-left shadow-xl"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute right-3 top-3 text-muted-foreground hover:text-brand-navy"
          >
            <X className="h-4 w-4" />
          </button>

          {(status === "idle" || status === "ended") && (
            <>
              <p className="pr-6 text-sm font-semibold text-brand-navy">
                Talk to our AI front desk
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ask about pricing, check stock, or book a repair — answered
                instantly, right in your browser.
              </p>
              <button
                type="button"
                onClick={handleStart}
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-brand-red text-sm font-semibold text-white transition-colors hover:bg-brand-red-dark"
              >
                <Phone className="h-4 w-4" />
                {status === "ended" ? "Call Again" : "Start Call"}
              </button>
            </>
          )}

          {status === "connecting" && (
            <div className="flex flex-col items-center gap-2 py-3 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand-red" />
              <p className="text-sm font-medium text-brand-navy">Connecting…</p>
            </div>
          )}

          {status === "active" && (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue-light transition-transform",
                  assistantSpeaking && "scale-110"
                )}
              >
                <span
                  className={cn(
                    "h-3 w-3 rounded-full bg-brand-blue",
                    assistantSpeaking && "animate-pulse"
                  )}
                />
              </div>
              <p className="text-sm font-medium text-brand-navy">
                {assistantSpeaking ? "Speaking…" : "Listening…"}
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                {formatElapsed(elapsed)}
              </p>
              <div className="mt-1 flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={muted ? "Unmute" : "Mute"}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-brand-navy transition-colors hover:bg-surface-muted"
                >
                  {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={stop}
                  aria-label="End call"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-red text-white transition-colors hover:bg-brand-red-dark"
                >
                  <PhoneOff className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {status === "error" && (
            <>
              <p className="pr-6 text-sm font-semibold text-brand-navy">
                Something went wrong
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
              <button
                type="button"
                onClick={reset}
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-brand-red text-sm font-semibold text-white transition-colors hover:bg-brand-red-dark"
              >
                Try Again
              </button>
            </>
          )}

          {status !== "active" && status !== "connecting" && (
            <p className="mt-4 border-t border-border pt-3 text-center text-xs text-muted-foreground">
              Prefer a person?{" "}
              <a
                href={telHref(PRIMARY_LOCATION.phone)}
                className="font-medium text-brand-blue hover:underline"
              >
                Call {PRIMARY_LOCATION.phone}
              </a>
            </p>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
