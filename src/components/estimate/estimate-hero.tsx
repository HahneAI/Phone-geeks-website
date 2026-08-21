import { ClipboardCheck } from "lucide-react";

export function EstimateHero() {
  return (
    <section className="relative overflow-hidden bg-brand-navy text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(37,99,235,0.35), transparent 40%), radial-gradient(circle at 85% 0%, rgba(224,51,44,0.25), transparent 45%)",
        }}
      />
      <ClipboardCheck
        className="pointer-events-none absolute -right-10 -top-14 h-56 w-56 -rotate-12 text-white/[0.06] sm:-right-6 sm:-top-16 sm:h-72 sm:w-72 lg:right-8 lg:top-8 lg:h-80 lg:w-80"
        strokeWidth={1}
      />
      <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-10 text-center sm:px-6 sm:pt-16">
        <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide text-white/80">
          Takes about 60 seconds
        </span>
        <h1 className="mx-auto mt-6 max-w-xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
          Get your instant repair quote
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-white/70">
          Answer a few quick questions and we&rsquo;ll email you a real
          estimate — no payment, no obligation.
        </p>
      </div>
    </section>
  );
}
