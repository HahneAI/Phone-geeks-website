import type { Metadata } from "next";
import Link from "next/link";
import { EstimateHero } from "@/components/estimate/estimate-hero";
import { QuoteWizard } from "@/components/estimate/quote-wizard";

export const metadata: Metadata = {
  title: "Get an Estimate | Phone Geeks",
  description:
    "Get an instant repair estimate from Phone Geeks in St. Louis. Pick your device, tell us what's wrong, and we'll email your quote.",
};

export default function EstimatePage() {
  return (
    <>
      <EstimateHero />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <QuoteWizard />
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Not sure what&rsquo;s even wrong?{" "}
          <Link href="/diagnose" className="font-medium text-brand-red hover:underline">
            Try our free diagnostic
          </Link>{" "}
          first.
        </p>
      </div>
    </>
  );
}
