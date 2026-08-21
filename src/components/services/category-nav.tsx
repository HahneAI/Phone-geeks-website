"use client";

import { useEffect, useRef } from "react";
import { SERVICE_CATEGORIES } from "@/lib/services-data";
import { scrollPastSticky } from "@/lib/utils";

export function CategoryNav() {
  const navRef = useRef<HTMLElement>(null);

  function goTo(slug: string) {
    const target = document.getElementById(slug);
    if (!target) return;
    scrollPastSticky(target, [navRef.current]);
    history.replaceState(null, "", `#${slug}`);
  }

  // Direct link / reload with a #slug in the URL: the browser's native jump
  // lands behind the sticky header + nav (whose height varies as it wraps),
  // so redo it once layout has settled.
  useEffect(() => {
    const slug = window.location.hash.slice(1);
    if (!slug) return;
    const id = requestAnimationFrame(() => {
      const target = document.getElementById(slug);
      if (target) scrollPastSticky(target, [navRef.current]);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <nav
      ref={navRef}
      className="sticky top-16 z-30 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 py-3 sm:px-6">
        {SERVICE_CATEGORIES.map((category) => (
          <a
            key={category.slug}
            href={`#${category.slug}`}
            onClick={(e) => {
              e.preventDefault();
              goTo(category.slug);
            }}
            className="shrink-0 rounded-full border border-border px-4 py-1.5 text-sm font-medium text-brand-navy transition-colors hover:border-brand-red/50 hover:bg-brand-red/5 hover:text-brand-red"
          >
            {category.title}
          </a>
        ))}
      </div>
    </nav>
  );
}
