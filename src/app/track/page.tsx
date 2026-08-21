import type { Metadata } from "next";
import { TrackerHero } from "@/components/tracker/tracker-hero";
import { TicketLookup } from "@/components/tracker/ticket-lookup";

export const metadata: Metadata = {
  title: "Track Your Repair | Phone Geeks",
  description:
    "Check the live status of your Phone Geeks repair — from drop-off to ready for pickup.",
};

export default function TrackPage() {
  return (
    <>
      <TrackerHero />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <TicketLookup />
      </div>
    </>
  );
}
