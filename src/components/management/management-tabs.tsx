"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/management", label: "Overview" },
  { href: "/management/stock", label: "Stock" },
  { href: "/management/checklist", label: "Anthony's Checklist" },
] as const;

/**
 * Horizontal tab row for /management — Overview / Stock / Anthony's
 * Checklist. The active tab gets a red underline that slides between
 * tabs on click via framer-motion's layoutId (a shared-element
 * animation: same layoutId on both the old and new active tab's
 * underline means framer-motion animates the transform between their
 * two positions automatically, rather than this component measuring
 * DOM rects by hand). A stiff, lightly-damped spring keeps the motion
 * quick and near-overshoot-free rather than bouncy.
 */
export function ManagementTabs() {
  const pathname = usePathname();

  return (
    <div className="mt-8 flex items-center gap-1 border-b border-black/10">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium transition-colors",
              active ? "text-brand-navy" : "text-black/50 hover:text-black/80"
            )}
          >
            {tab.label}
            {active && (
              <motion.span
                layoutId="management-tab-highlight"
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-red"
                transition={{ type: "spring", stiffness: 520, damping: 38 }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
