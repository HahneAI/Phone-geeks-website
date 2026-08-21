"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Sparkles, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { scrollPastSticky } from "@/lib/utils";
import { DIAGNOSE_CATEGORIES, SYMPTOMS_BY_CATEGORY } from "@/lib/diagnose-data";

type Step = "device" | "symptom" | "result";

export function DiagnosticQuiz() {
  const [step, setStep] = useState<Step>("device");
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [symptomIndex, setSymptomIndex] = useState<number | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const prevStepRef = useRef<Step | null>(null);

  useEffect(() => {
    if (prevStepRef.current !== null && prevStepRef.current !== step && cardRef.current) {
      scrollPastSticky(cardRef.current);
    }
    prevStepRef.current = step;
  }, [step]);

  const category = DIAGNOSE_CATEGORIES.find((c) => c.slug === categorySlug) ?? null;
  const symptoms = categorySlug ? SYMPTOMS_BY_CATEGORY[categorySlug] : [];
  const symptom = symptomIndex !== null ? symptoms[symptomIndex] : null;
  const repair = category?.repairs.find((r) => r.name === symptom?.repairName) ?? null;

  function reset() {
    setStep("device");
    setCategorySlug(null);
    setSymptomIndex(null);
  }

  return (
    <Card ref={cardRef} className="mx-auto max-w-2xl p-6 sm:p-10">
      {step === "device" && (
        <div>
          <h2 className="text-xl font-bold text-brand-navy">
            What kind of device is it?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We&rsquo;ll ask one follow-up, then give you a likely diagnosis.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {DIAGNOSE_CATEGORIES.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => {
                  setCategorySlug(c.slug);
                  setStep("symptom");
                }}
                className="flex flex-col items-center gap-3 rounded-2xl border-2 border-border p-6 text-center transition-all hover:-translate-y-1 hover:border-brand-red/50 hover:shadow-md"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red">
                  <c.icon className="h-6 w-6" strokeWidth={2} />
                </span>
                <span className="font-semibold text-brand-navy">{c.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "symptom" && category && (
        <div>
          <BackButton onClick={() => setStep("device")} />
          <h2 className="mt-4 text-xl font-bold text-brand-navy">
            What&rsquo;s it doing?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick whichever sounds closest.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            {symptoms.map((s, index) => (
              <button
                key={s.label}
                type="button"
                onClick={() => {
                  setSymptomIndex(index);
                  setStep("result");
                }}
                className="rounded-xl border-2 border-border p-4 text-left font-medium text-brand-navy transition-all hover:border-brand-red/50 hover:shadow-sm"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "result" && category && symptom && repair && (
        <div className="text-center">
          <BackButton onClick={() => setStep("symptom")} />
          <span className="mx-auto mt-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red">
            <Wrench className="h-6 w-6" strokeWidth={2} />
          </span>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Likely diagnosis
          </p>
          <h2 className="mt-1 text-2xl font-bold text-brand-navy">
            {repair.name}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            {symptom.reasoning}
          </p>

          <div className="mx-auto mt-6 flex max-w-xs items-center justify-between rounded-2xl border-2 border-border p-5">
            <div className="text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Estimated price
              </p>
              <p className="text-lg font-bold text-brand-navy">{repair.priceRange}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Turnaround
              </p>
              <p className="text-lg font-bold text-brand-navy">{repair.turnaround}</p>
            </div>
          </div>

          <p className="mx-auto mt-6 flex max-w-md items-start gap-2 text-left text-xs text-muted-foreground">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-blue" />
            A geek will always confirm this in person before any work
            starts — this is a starting point, not a final quote.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href="/estimate">Get a Real Estimate</Button>
            <Button variant="ghost" onClick={reset}>
              Start Over
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-brand-navy"
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </button>
  );
}
