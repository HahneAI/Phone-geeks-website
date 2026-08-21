"use client";

import { useEffect, useState } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

const REVIEWS = [
  {
    name: "Shannon Schindler Redman",
    text: "Fast, friendly, and my screen looks brand new. In and out in under an hour like they promised.",
  },
  {
    name: "Mike Sterba",
    text: "Honest pricing and they explained exactly what was wrong before touching my phone. Will be back.",
  },
  {
    name: "Theresa Vail",
    text: "Saved my laptop after a water spill I thought was a lost cause. Genuinely appreciate these guys.",
  },
];

export function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % REVIEWS.length);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  const goTo = (i: number) => setIndex((i + REVIEWS.length) % REVIEWS.length);

  return (
    <section className="bg-brand-navy py-20 text-white">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <div className="flex justify-center gap-1 text-brand-red">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-5 w-5 fill-brand-red" />
          ))}
        </div>
        <h2 className="mt-4 text-3xl font-bold tracking-tight">
          What our customers say
        </h2>

        <div className="relative mt-10">
          <Quote className="mx-auto h-8 w-8 text-white/20" />
          <p className="mt-4 min-h-24 text-lg leading-relaxed text-white/85">
            &ldquo;{REVIEWS[index].text}&rdquo;
          </p>
          <p className="mt-4 text-sm font-semibold text-brand-red">
            {REVIEWS[index].name}
          </p>
          <p className="text-xs text-white/50">Google Review</p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              aria-label="Previous review"
              onClick={() => goTo(index - 1)}
              className="rounded-full border border-white/20 p-2 hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex gap-2">
              {REVIEWS.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to review ${i + 1}`}
                  onClick={() => goTo(i)}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all",
                    i === index ? "w-6 bg-brand-red" : "bg-white/30"
                  )}
                />
              ))}
            </div>
            <button
              aria-label="Next review"
              onClick={() => goTo(index + 1)}
              className="rounded-full border border-white/20 p-2 hover:bg-white/10"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
