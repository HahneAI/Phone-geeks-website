import { Bot } from "lucide-react";

export function AiRoadmapNote() {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border-2 border-brand-blue/20 bg-brand-blue-light px-6 py-5 sm:px-8 sm:py-6">
      <div className="flex items-start gap-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-blue text-white">
          <Bot className="h-4.5 w-4.5" strokeWidth={2} />
        </span>
        <div>
          <p className="font-semibold text-brand-navy">
            Today: a rule-based skeleton
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-brand-navy/80">
            This flow is a fixed decision tree — pick a device, pick a
            symptom, get a likely fix. The real opportunity is training a
            conversational AI agent on Phone Geeks&rsquo; own repair
            history and how the technicians actually triage devices in
            person, so it can ask the right follow-up questions and get
            sharper with every repair instead of running down a fixed list
            like this one.
          </p>
        </div>
      </div>
    </div>
  );
}
