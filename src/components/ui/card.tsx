import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-border bg-surface shadow-sm",
        className
      )}
      {...props}
    />
  );
}
