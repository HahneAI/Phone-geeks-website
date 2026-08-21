import { MapPin, Phone, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatSchedule, type StoreLocation } from "@/lib/locations";
import { OpenStatus } from "./open-status";

export function LocationCard({ location }: { location: StoreLocation }) {
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(
    location.address
  )}&output=embed`;
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    location.address
  )}`;

  return (
    <Card className="overflow-hidden">
      <div className="aspect-[16/9] w-full bg-surface-muted">
        <iframe
          src={mapSrc}
          title={`Map to Phone Geeks ${location.name}`}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold text-brand-navy">
            {location.name}
          </h3>
          <OpenStatus schedule={location.schedule} />
        </div>

        <div className="mt-4 space-y-2.5 text-sm">
          <p className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
            {location.address}
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0 text-brand-red" />
            <a href={`tel:${location.phone}`} className="hover:text-brand-navy">
              {location.phone}
            </a>
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0 text-brand-red" />
            {formatSchedule(location.schedule)}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            href={directionsHref}
            size="sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get Directions
          </Button>
          <Button
            href="/estimate"
            variant="ghost"
            size="sm"
            className="border border-border"
          >
            Book a Repair
          </Button>
        </div>
      </div>
    </Card>
  );
}
