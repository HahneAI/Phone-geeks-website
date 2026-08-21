"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Clock, Mail, PackageCheck, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn, scrollPastSticky } from "@/lib/utils";
import { SERVICE_CATEGORIES, type RepairItem } from "@/lib/services-data";
import { LOCATIONS } from "@/lib/locations";
import { StepProgress } from "./step-progress";

const DEVICE_CATEGORIES = SERVICE_CATEGORIES.filter(
  (category) => category.repairs.length > 0
);

const MAIL_IN = {
  slug: "mail-in",
  name: "Mail-In Repair",
  description: "Ship it to us and we'll email your quote before we touch a thing.",
};

const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter your name"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().optional(),
});

type ContactValues = z.infer<typeof contactSchema>;

type Step = "device" | "issue" | "location" | "contact" | "result";

export function QuoteWizard() {
  const [step, setStep] = useState<Step>("device");
  const [deviceSlug, setDeviceSlug] = useState<string | null>(null);
  const [issue, setIssue] = useState<RepairItem | null>(null);
  const [locationSlug, setLocationSlug] = useState<string | null>(null);
  const [contact, setContact] = useState<ContactValues | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const prevStepRef = useRef<Step | null>(null);

  // Land each step (including the final result) at the top of the wizard
  // card, clear of the sticky header. Compares against the previous step
  // rather than a "did we mount yet" flag so it's a no-op on an unchanged
  // step — including React Strict Mode's dev-only double effect run on
  // mount — and only fires on a genuine step transition.
  useEffect(() => {
    if (prevStepRef.current !== null && prevStepRef.current !== step && cardRef.current) {
      scrollPastSticky(cardRef.current);
    }
    prevStepRef.current = step;
  }, [step]);

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<ContactValues>({ resolver: zodResolver(contactSchema) });

  const device = DEVICE_CATEGORIES.find((c) => c.slug === deviceSlug) ?? null;
  const location =
    locationSlug === MAIL_IN.slug
      ? MAIL_IN
      : LOCATIONS.find((l) => l.slug === locationSlug) ?? null;

  const stepNumber = { device: 1, issue: 2, location: 3, contact: 4, result: 5 }[
    step
  ];

  function reset() {
    setStep("device");
    setDeviceSlug(null);
    setIssue(null);
    setLocationSlug(null);
    setContact(null);
    resetForm();
  }

  return (
    <Card ref={cardRef} className="mx-auto max-w-2xl p-6 sm:p-10">
      {step !== "result" && (
        <div className="mb-10">
          <StepProgress current={stepNumber} />
        </div>
      )}

      {step === "device" && (
        <div>
          <h2 className="text-xl font-bold text-brand-navy">
            What needs fixing?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick the type of device you&rsquo;ve got.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {DEVICE_CATEGORIES.map((category) => (
              <button
                key={category.slug}
                type="button"
                onClick={() => {
                  setDeviceSlug(category.slug);
                  setStep("issue");
                }}
                className="flex flex-col items-center gap-3 rounded-2xl border-2 border-border p-6 text-center transition-all hover:-translate-y-1 hover:border-brand-red/50 hover:shadow-md"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red">
                  <category.icon className="h-6 w-6" strokeWidth={2} />
                </span>
                <span className="font-semibold text-brand-navy">
                  {category.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "issue" && device && (
        <div>
          <BackButton onClick={() => setStep("device")} />
          <h2 className="mt-4 text-xl font-bold text-brand-navy">
            What&rsquo;s wrong with your {device.shortLabel}?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick the closest match — we&rsquo;ll confirm the exact issue in person.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            {device.repairs.map((repair) => (
              <button
                key={repair.name}
                type="button"
                onClick={() => {
                  setIssue(repair);
                  setStep("location");
                }}
                className="flex items-center justify-between rounded-xl border-2 border-border p-4 text-left transition-all hover:border-brand-red/50 hover:shadow-sm"
              >
                <span className="font-medium text-brand-navy">
                  {repair.name}
                </span>
                <span className="flex items-center gap-3 text-sm">
                  <span className="font-semibold text-brand-navy">
                    {repair.priceRange}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-red/10 px-2.5 py-1 text-xs font-semibold text-brand-red">
                    <Clock className="h-3 w-3" />
                    {repair.turnaround}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "location" && (
        <div>
          <BackButton onClick={() => setStep("issue")} />
          <h2 className="mt-4 text-xl font-bold text-brand-navy">
            How do you want to get it to us?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a shop or ship it in.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[...LOCATIONS, MAIL_IN].map((loc) => (
              <button
                key={loc.slug}
                type="button"
                onClick={() => {
                  setLocationSlug(loc.slug);
                  setStep("contact");
                }}
                className="flex flex-col items-start gap-2 rounded-xl border-2 border-border p-4 text-left transition-all hover:border-brand-red/50 hover:shadow-sm"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-red/10 text-brand-red">
                  {loc.slug === "mail-in" ? (
                    <PackageCheck className="h-4 w-4" />
                  ) : (
                    <Store className="h-4 w-4" />
                  )}
                </span>
                <span className="font-semibold text-brand-navy">
                  {loc.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {"address" in loc ? loc.address : loc.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "contact" && (
        <div>
          <BackButton onClick={() => setStep("location")} />
          <h2 className="mt-4 text-xl font-bold text-brand-navy">
            Last step — where should we send it?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We&rsquo;ll email your estimate within minutes.
          </p>
          <form
            className="mt-6 flex flex-col gap-4"
            onSubmit={handleSubmit((values) => {
              setContact(values);
              setStep("result");
            })}
          >
            <Field
              label="Name"
              error={errors.name?.message}
              inputProps={register("name")}
            />
            <Field
              label="Email"
              type="email"
              error={errors.email?.message}
              inputProps={register("email")}
            />
            <Field
              label="Phone (optional)"
              type="tel"
              error={errors.phone?.message}
              inputProps={register("phone")}
            />
            <Button type="submit" size="lg" className="mt-2 w-full">
              Get My Estimate
            </Button>
          </form>
        </div>
      )}

      {step === "result" && device && issue && location && contact && (
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red">
            <Mail className="h-6 w-6" strokeWidth={2} />
          </span>
          <h2 className="mt-4 text-2xl font-bold text-brand-navy">
            $0.00 due today
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            We&rsquo;re sending your estimate to{" "}
            <span className="font-medium text-brand-navy">{contact.email}</span>{" "}
            within minutes — no payment until the repair&rsquo;s done.
          </p>

          <dl className="mt-8 grid gap-4 rounded-2xl border-2 border-border p-6 text-left sm:grid-cols-2">
            <SummaryRow label="Device" value={device.title} />
            <SummaryRow label="Issue" value={issue.name} />
            <SummaryRow label="Estimated price" value={issue.priceRange} />
            <SummaryRow label="Turnaround" value={issue.turnaround} />
            <SummaryRow
              label={"address" in location ? "Drop-off" : "Method"}
              value={location.name}
            />
            <SummaryRow label="Name" value={contact.name} />
          </dl>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href="/contact" variant="secondary">
              Get Directions
            </Button>
            <Button variant="ghost" onClick={reset}>
              Start a New Estimate
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium text-brand-navy">{value}</dd>
    </div>
  );
}

function Field({
  label,
  error,
  type = "text",
  inputProps,
}: {
  label: string;
  error?: string;
  type?: string;
  inputProps: UseFormRegisterReturn;
}) {
  return (
    <label className="block text-left">
      <span className="text-sm font-medium text-brand-navy">{label}</span>
      <input
        type={type}
        className={cn(
          "mt-1.5 w-full rounded-lg border-2 border-border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand-blue",
          error && "border-red-400"
        )}
        {...inputProps}
      />
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}
