import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export function CtaBanner() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="flex flex-col items-center gap-6 rounded-3xl bg-brand-red px-6 py-14 text-center text-white sm:px-14">
        <MapPin className="h-8 w-8" />
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Two locations. One geek squad.
        </h2>
        <p className="max-w-md text-white/90">
          Stop by our Arnold or Ballwin shop, or start your repair online in
          under a minute.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button href="/estimate" variant="secondary" size="lg">
            Get Instant Repair Quote
          </Button>
          <Button href="/contact" variant="outline" size="lg">
            Find a Location
          </Button>
        </div>
      </div>
    </section>
  );
}
