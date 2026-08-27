"use client";

import dynamic from "next/dynamic";
import { track } from "@vercel/analytics";
import { isVoiceAgentConfigured, vapiPublicKey, vapiAssistantId } from "@/lib/use-vapi-call";
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
 * positioned bottom-left instead so the two never visually stack. Two
 * independent ways to start a real voice call on the same page is itself
 * worth a product decision (keep both? fold the header button into this
 * widget only?) — flagged in TODO.md rather than decided here.
 *
 * Dynamically imported with ssr: false — it drives WebRTC/mic access, which
 * only exists in the browser.
 */
const VapiWidget = dynamic(
  () => import("@vapi-ai/client-sdk-react").then((mod) => mod.VapiWidget),
  { ssr: false }
);

export function VapiChatWidget() {
  if (!isVoiceAgentConfigured || !vapiPublicKey || !vapiAssistantId) return null;

  return (
    <VapiWidget
      publicKey={vapiPublicKey}
      assistantId={vapiAssistantId}
      mode="hybrid"
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
      onVoiceStart={() => track("voice_call_connected", { source: "chat_widget" })}
      onVoiceEnd={() => track("voice_call_ended", { source: "chat_widget" })}
      onError={(error) =>
        track("voice_call_failed", { source: "chat_widget", message: error.message })
      }
    />
  );
}
