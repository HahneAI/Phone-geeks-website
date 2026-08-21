import type { Metadata } from "next";
import { PackageCheck, Info } from "lucide-react";
import { ContactHero } from "@/components/contact/contact-hero";
import { LocationCard } from "@/components/contact/location-card";
import { Button } from "@/components/ui/button";
import { LOCATIONS } from "@/lib/locations";

export const metadata: Metadata = {
  title: "Locations | Phone Geeks",
  description:
    "Visit Phone Geeks in Arnold or Ballwin, MO for phone, computer, and tablet repair. Get directions, hours, and phone numbers.",
};

export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          {LOCATIONS.map((location) => (
            <LocationCard key={location.slug} location={location} />
          ))}
        </div>

        <div className="mt-8 flex flex-col items-start gap-4 rounded-2xl border-2 border-border bg-surface-muted p-6 sm:flex-row sm:items-center">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-blue-light text-brand-blue">
            <Info className="h-5 w-5" />
          </span>
          <p className="text-sm text-muted-foreground">
            We also have a location in Affton — it&rsquo;s not yet set up for
            online booking, so give one of the shops above a call and
            we&rsquo;ll point you the right way.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-start gap-4 rounded-2xl border-2 border-border p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red">
              <PackageCheck className="h-5 w-5" />
            </span>
            <p className="text-sm text-muted-foreground">
              Not near Arnold or Ballwin? Ship your device to us for a
              mail-in repair — start your estimate and pick{" "}
              <span className="font-medium text-brand-navy">
                Mail-In Repair
              </span>{" "}
              at the drop-off step.
            </p>
          </div>
          <Button href="/estimate" variant="secondary" size="sm" className="shrink-0">
            Start an Estimate
          </Button>
        </div>
      </div>
    </>
  );
}
