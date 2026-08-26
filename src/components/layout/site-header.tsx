"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CallWidget, FloatingCallBar } from "@/components/layout/call-widget";
import { useVapiCall } from "@/lib/use-vapi-call";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/estimate", label: "Get an Estimate" },
  { href: "/track", label: "Track Repair" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Locations" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  // Single shared call session for every CallWidget trigger point below
  // (desktop bar, mobile icon, hamburger menu) — see VapiCall's doc comment.
  const call = useVapiCall();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-navy/95 backdrop-blur supports-[backdrop-filter]:bg-brand-navy/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-red">
            <Smartphone className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Phone Geeks
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/80 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <CallWidget call={call} />
          <Button href="/estimate" size="sm">
            Book a Repair
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <CallWidget call={call} iconOnly />
          <button
            className="text-white"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-white/10 bg-brand-navy transition-[max-height] duration-300 md:hidden",
          open ? "max-h-80" : "max-h-0"
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2">
            <CallWidget call={call} buttonClassName="w-full justify-center" />
            <Button href="/estimate" size="sm" className="w-full">
              Book a Repair
            </Button>
          </div>
        </nav>
      </div>

      <FloatingCallBar call={call} />
    </header>
  );
}
