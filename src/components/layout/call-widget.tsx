"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { Phone, PhoneOff, Mic, MicOff, Loader2, X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { isVoiceAgentConfigured, vapiDebugInfo, type VapiCall } from "@/lib/use-vapi-call";
import { useActiveCallSource } from "@/lib/call-coordinator";
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

/** Drag offset (in px) from a fixed bottom-right anchor, plus the pointer
 * handlers for the grip handle. Pointer Events cover mouse + touch alike. */
function useDraggable() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragState = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(
    null
  );

  function onPointerDown(e: ReactPointerEvent<HTMLButtonElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, baseX: offset.x, baseY: offset.y };
    setDragging(true);
  }
  function onPointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setOffset({ x: dragState.current.baseX + dx, y: dragState.current.baseY + dy });
  }
  function onPointerUp() {
    dragState.current = null;
    setDragging(false);
  }

  return { offset, dragging, onPointerDown, onPointerMove, onPointerUp };
}

interface CallWidgetProps {
  /** One shared useVapiCall() instance, owned by SiteHeader and passed to
   * every trigger point (desktop bar, mobile icon, hamburger menu) — so
   * tapping any of them controls the same real call instead of each
   * starting its own independent (and independently billed) session. */
  call: VapiCall;
  className?: string;
  buttonClassName?: string;
  /** Compact circular icon, no "Call Now" label — for tight header spots
   * like the mobile top bar, where the full dropdown still lives in the
   * hamburger menu as a separate CallWidget instance. */
  iconOnly?: boolean;
}

export function CallWidget({ call, className, buttonClassName, iconOnly }: CallWidgetProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const mounted = useMounted();
  const debugMode = useDebugMode();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { status, muted, assistantSpeaking, errorMessage, debugDetail, elapsed, start, stop, toggleMute, reset } =
    call;
  // The chat widget's voice mode is a live call elsewhere on the page —
  // see src/lib/call-coordinator.ts. start() already refuses in this
  // case, but disabling the trigger up front is clearer than letting
  // someone open the popup only to hit an error on click.
  const blockedByChatWidget = useActiveCallSource() === "chat-widget";

  // Once the call actually connects, hand off from this popup to the
  // FloatingCallBar automatically — the popup no longer requires an
  // explicit close (a click on the new drag toolbar was closing it only
  // as a side effect of the outside-click-to-dismiss listener below).
  useEffect(() => {
    if (status !== "active") return;
    const t = setTimeout(() => setOpen(false), 900);
    return () => clearTimeout(t);
  }, [status]);

  // The panel's position is recalculated whenever it opens — it's portaled
  // to <body> (position: fixed) rather than nested under the button, since
  // the mobile menu it can live inside uses overflow-hidden for its
  // collapse animation and would otherwise clip it.
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
          <span
            className={cn(
              "inline-flex h-9 items-center rounded-full border border-amber-300/60 bg-amber-500/10 text-xs font-semibold text-amber-100",
              iconOnly ? "w-9 justify-center px-0" : "px-4"
            )}
          >
            {iconOnly ? "⚠" : "⚠ Voice agent debug"}
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
        aria-label={iconOnly ? `Call ${PRIMARY_LOCATION.phone}` : undefined}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-full border border-white/30 text-sm font-semibold text-white transition-colors hover:bg-white/10",
          iconOnly ? "w-9 justify-center px-0" : "px-4",
          buttonClassName
        )}
      >
        <Phone className="h-4 w-4 text-brand-red" />
        {!iconOnly && PRIMARY_LOCATION.phone}
      </a>
    );
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        disabled={blockedByChatWidget}
        onClick={() => setOpen((v) => !v)}
        aria-label={
          iconOnly
            ? blockedByChatWidget
              ? "Call Now (unavailable — a call is already active in chat)"
              : "Call Now"
            : undefined
        }
        title={
          blockedByChatWidget
            ? "A call is already in progress in the chat widget"
            : undefined
        }
        className={cn(
          "relative inline-flex h-9 items-center gap-2 rounded-full border border-white/30 text-sm font-semibold text-white transition-colors hover:bg-white/10",
          iconOnly ? "w-9 justify-center px-0" : "px-4",
          blockedByChatWidget && "cursor-not-allowed opacity-50 hover:bg-transparent",
          buttonClassName
        )}
      >
        <Phone className="h-4 w-4 text-brand-red" />
        {!iconOnly && (blockedByChatWidget ? "Call Active" : "Call Now")}
        {status === "active" && !open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
        )}
      </button>

      {mounted && createPortal(
        <div
          ref={panelRef}
          inert={!open}
          style={{ top: coords.top, right: coords.right, pointerEvents: open ? "auto" : "none" }}
          className={cn(
            "fixed z-50 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-border bg-white p-5 text-left shadow-xl transition-all duration-200 ease-out",
            open ? "translate-y-0 scale-100 opacity-100" : "-translate-y-2 scale-95 opacity-0"
          )}
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
                onClick={start}
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
              {debugMode && debugDetail && (
                <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-amber-50 p-2 text-[10px] text-amber-900">
                  {debugDetail}
                </pre>
              )}
              <button
                type="button"
                onClick={reset}
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-brand-red text-sm font-semibold text-white transition-colors hover:bg-brand-red-dark"
              >
                Try Again
              </button>
            </>
          )}

          {debugMode && (
            <p className="mt-3 border-t border-border pt-2 text-center text-[10px] text-muted-foreground">
              debug: key {vapiDebugInfo.publicKeyPreview ?? "—"} · assistant{" "}
              {vapiDebugInfo.assistantId ?? "—"}
            </p>
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

/**
 * Persistent mini call bar — mounted exactly once (in SiteHeader, alongside
 * the single shared useVapiCall() instance), shown whenever a call is
 * active. Kept as a standalone component rather than inside CallWidget so
 * only ever one bar renders, regardless of how many CallWidget trigger
 * points exist in the header at once. Drag handle lets it be moved out of
 * the way of page content.
 */
export function FloatingCallBar({ call }: { call: VapiCall }) {
  const mounted = useMounted();
  const drag = useDraggable();
  const { status, muted, assistantSpeaking, elapsed, toggleMute, stop } = call;
  const activeNow = status === "active";

  if (!mounted) return null;

  // Always portal-mounted (once on the client) rather than conditionally
  // rendered on `activeNow` — visibility is purely a CSS transition on
  // opacity/transform, so there's no unmount-timing to get right for the
  // exit animation, and the drag offset + enter/exit transform can share
  // one `transform` value without an inline style vs. Tailwind class fight.
  return createPortal(
    <div
      inert={!activeNow}
      style={{
        transform: `translate(${drag.offset.x}px, ${drag.offset.y + (activeNow ? 0 : 12)}px) scale(${activeNow ? 1 : 0.95})`,
        opacity: activeNow ? 1 : 0,
        pointerEvents: activeNow ? "auto" : "none",
        transition: drag.dragging ? "none" : "opacity 250ms ease-out, transform 250ms ease-out",
      }}
      className="fixed bottom-5 right-5 z-[60] flex items-center gap-1 rounded-full border border-border bg-white/95 px-2 py-1.5 shadow-2xl backdrop-blur"
    >
      <button
        type="button"
        onPointerDown={drag.onPointerDown}
        onPointerMove={drag.onPointerMove}
        onPointerUp={drag.onPointerUp}
        onPointerCancel={drag.onPointerUp}
        aria-label="Drag to move"
        style={{ touchAction: "none" }}
        className="flex h-8 w-8 cursor-grab items-center justify-center text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex items-center gap-1.5 px-1 text-xs font-medium text-brand-navy">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            assistantSpeaking ? "animate-pulse bg-brand-blue" : "bg-green-500"
          )}
        />
        <span className="font-mono">{formatElapsed(elapsed)}</span>
      </span>
      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Unmute" : "Mute"}
        className="flex h-8 w-8 items-center justify-center rounded-full text-brand-navy transition-colors hover:bg-surface-muted"
      >
        {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={stop}
        aria-label="End call"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-red text-white transition-colors hover:bg-brand-red-dark"
      >
        <PhoneOff className="h-4 w-4" />
      </button>
    </div>,
    document.body
  );
}
