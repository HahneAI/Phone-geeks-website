import type { Metadata } from "next";
import { DiagnoseHero } from "@/components/diagnose/diagnose-hero";
import { AiRoadmapNote } from "@/components/diagnose/ai-roadmap-note";
import { DiagnosticQuiz } from "@/components/diagnose/diagnostic-quiz";

export const metadata: Metadata = {
  title: "Free Diagnostic | Phone Geeks",
  description:
    "Not sure what's wrong? Answer two quick questions and get a likely diagnosis from Phone Geeks — free, before you talk to anyone.",
};

export default function DiagnosePage() {
  return (
    <>
      <DiagnoseHero />
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 sm:py-16">
        <AiRoadmapNote />
        <DiagnosticQuiz />
      </div>
    </>
  );
}
