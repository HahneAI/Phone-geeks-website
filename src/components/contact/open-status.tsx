"use client";

import { useSyncExternalStore } from "react";
import type { WeeklySchedule } from "@/lib/locations";
import { cn } from "@/lib/utils";

function subscribeToClock(callback: () => void) {
  const id = setInterval(callback, 60_000);
  return () => clearInterval(id);
}

/** Buckets by the minute so re-renders only happen when the minute actually changes. */
function getMinuteSnapshot() {
  return Math.floor(Date.now() / 60_000);
}

/** Sentinel meaning "unknown yet" — keeps SSR markup and first client render identical. */
function getServerSnapshot() {
  return -1;
}

function getStatus(schedule: WeeklySchedule, now: Date) {
  const today = schedule[now.getDay()];
  if (!today) return { open: false, label: "Closed today" };

  const hour = now.getHours() + now.getMinutes() / 60;
  const isOpen = hour >= today.open && hour < today.close;

  if (isOpen) {
    const closeLabel =
      today.close === 12
        ? "12pm"
        : today.close > 12
          ? `${today.close - 12}pm`
          : `${today.close}am`;
    return { open: true, label: `Open now · closes ${closeLabel}` };
  }

  return { open: false, label: "Closed now" };
}

export function OpenStatus({ schedule }: { schedule: WeeklySchedule }) {
  const minuteBucket = useSyncExternalStore(
    subscribeToClock,
    getMinuteSnapshot,
    getServerSnapshot
  );

  if (minuteBucket === -1) {
    return <span className="h-5 w-28 animate-pulse rounded-full bg-border" />;
  }

  const status = getStatus(schedule, new Date());

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        status.open
          ? "bg-green-100 text-green-700"
          : "bg-muted-foreground/10 text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status.open ? "bg-green-600" : "bg-muted-foreground"
        )}
      />
      {status.label}
    </span>
  );
}
