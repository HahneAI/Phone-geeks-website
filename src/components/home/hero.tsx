import { Button } from "@/components/ui/button";
import { Clock, ShieldCheck, Star } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-navy text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(37,99,235,0.35), transparent 40%), radial-gradient(circle at 85% 0%, rgba(224,51,44,0.25), transparent 45%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide text-white/80">
            St. Louis &middot; Family-run since 2016
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            Revive your tech.
            <br />
            <span className="text-brand-red">One hour.</span> One-year
            warranty.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/70">
            Screens, batteries, water damage, Macbooks &amp; more — fixed by
            real geeks who&rsquo;ve been doing this since 2016. Walk in,
            get a quote, walk out fixed.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="/estimate" size="lg">
              Get Instant Repair Quote
            </Button>
            <Button href="/services" size="lg" variant="outline">
              Browse Services
            </Button>
          </div>

          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-8">
            <div>
              <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-white/50">
                <Clock className="h-3.5 w-3.5" /> Turnaround
              </dt>
              <dd className="mt-1 text-xl font-bold">~1 hour</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-white/50">
                <ShieldCheck className="h-3.5 w-3.5" /> Warranty
              </dt>
              <dd className="mt-1 text-xl font-bold">1 year</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-white/50">
                <Star className="h-3.5 w-3.5" /> Reviews
              </dt>
              <dd className="mt-1 text-xl font-bold">5.0★ Google</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
