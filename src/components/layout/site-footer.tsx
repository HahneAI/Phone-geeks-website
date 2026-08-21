import Link from "next/link";
import { Smartphone, MapPin, Phone } from "lucide-react";
import { LOCATIONS } from "@/lib/locations";

const SITEMAP = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/estimate", label: "Get an Estimate" },
  { href: "/diagnose", label: "Free Diagnostic" },
  { href: "/track", label: "Track Repair" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Locations" },
];

export function SiteFooter() {
  return (
    <footer className="bg-brand-navy-dark text-white/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-red">
              <Smartphone className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <span className="text-base font-bold tracking-tight">
              Phone Geeks
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed">
            St. Louis&rsquo; family-run phone &amp; computer repair shop since
            2016. One-hour turnaround, one-year warranty.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
            Sitemap
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {SITEMAP.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
            Locations
          </h3>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {LOCATIONS.map((loc) => (
              <div key={loc.slug} className="text-sm">
                <p className="font-semibold text-white">{loc.name}</p>
                <p className="mt-1 flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  {loc.address}
                </p>
                <p className="mt-1 flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0" />
                  <a href={`tel:${loc.phone}`} className="hover:text-white">
                    {loc.phone}
                  </a>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-6 text-center text-xs sm:px-6">
        © {new Date().getFullYear()} Phone Geeks. All rights reserved.
      </div>
    </footer>
  );
}
