"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { track } from "@vercel/analytics";
import { isVoiceAgentConfigured, vapiPublicKey, vapiAssistantId } from "@/lib/use-vapi-call";
import {
  claimCallSlot,
  releaseCallSlot,
  useActiveCallSource,
} from "@/lib/call-coordinator";
import "@vapi-ai/client-sdk-react/styles";

/**
 * Floating chat-and-voice widget (official @vapi-ai/client-sdk-react
 * component), separate from the header "Call Now" button in
 * call-widget.tsx. Reuses the same NEXT_PUBLIC_VAPI_PUBLIC_KEY /
 * NEXT_PUBLIC_VAPI_ASSISTANT_ID env vars and the same isVoiceAgentConfigured
 * check — no new config to add in Vercel.
 *
 * Continuity note (checked against the package's own README/types, since
 * docs.vapi.ai itself isn't reachable from this environment): mode="hybrid"
 * lets a visitor switch between text and voice in one widget, but the
 * package does NOT document that a voice call shares the same session or
 * transcript as the text chat before it — @vapi-ai/web (the header widget's
 * SDK) and this component's chat mode are separate client connections to
 * the same assistant, not one continuous thread. Don't tell a visitor
 * their voice call "continues" the chat — it starts a new conversation with
 * the same assistant. A real shared-context bridge would need a
 * server-side piece (e.g. the site's own backend passing the chat
 * transcript into the voice call's assistant overrides via a private-key
 * API call) — not implemented here; see TODO.md §5.
 *
 * Known overlap: while a call is active via the header widget, its
 * FloatingCallBar also sits bottom-right — this widget is deliberately
 * positioned bottom-left instead so the two never visually stack.
 *
 * Double-call prevention (src/lib/call-coordinator.ts): the packaged
 * <VapiWidget> exposes no prop or ref to intercept its internal "start
 * voice call" button, so this can't refuse a click the way
 * use-vapi-call.ts's start() refuses to start a header call — instead,
 * whenever the header holds the shared call slot, this renders with
 * mode="chat" instead of "hybrid", which removes the voice button from
 * the widget entirely so there's nothing to click. onVoiceStart/
 * onVoiceEnd/onError claim and release the slot on this widget's side,
 * which in turn makes the header's own start() correctly refuse while a
 * chat-widget call is live. One small honest gap: onVoiceStart likely
 * fires once the call has already connected (not before), so there's a
 * brief window where both could theoretically start if triggered at the
 * same instant — acceptable for one person on one page, not a hard
 * cross-process guarantee.
 *
 * Dynamically imported with ssr: false — it drives WebRTC/mic access, which
 * only exists in the browser.
 */
const VapiWidget = dynamic(
  () => import("@vapi-ai/client-sdk-react").then((mod) => mod.VapiWidget),
  { ssr: false }
);

export function VapiChatWidget() {
  const pathname = usePathname();
  const activeCallSource = useActiveCallSource();
  // Owner-only tooling, not a customer touchpoint — the widget would just
  // cover up the dashboard's own bottom-left corner content otherwise.
  if (pathname?.startsWith("/management")) return null;
  if (!isVoiceAgentConfigured || !vapiPublicKey || !vapiAssistantId) return null;

  return (
    <VapiWidget
      publicKey={vapiPublicKey}
      assistantId={vapiAssistantId}
      // Drops to chat-only (no voice button at all) while the header
      // widget already has a live call — see the double-call prevention
      // note above.
      mode={activeCallSource === "header" ? "chat" : "hybrid"}
      position="bottom-left"
      size="compact"
      theme="light"
      accentColor="#e0332c"
      ctaButtonColor="#0b2a4a"
      ctaButtonTextColor="#ffffff"
      title="Phone Geeks"
      ctaTitle="Chat with us"
      ctaSubtitle="Text or talk — we're here"
      startButtonText="Start voice call"
      endButtonText="End call"
      chatPlaceholder="Ask about pricing, stock, or your repair…"
      chatFirstMessage="Hey! I'm the Phone Geeks assistant — ask me anything, or switch to a voice call any time."
      onVoiceStart={() => {
        claimCallSlot("chat-widget");
        track("voice_call_connected", { source: "chat_widget" });
      }}
      onVoiceEnd={() => {
        releaseCallSlot("chat-widget");
        track("voice_call_ended", { source: "chat_widget" });
      }}
      onError={(error) => {
        releaseCallSlot("chat-widget");
        track("voice_call_failed", { source: "chat_widget", message: error.message });
      }}
    />
  );
}
