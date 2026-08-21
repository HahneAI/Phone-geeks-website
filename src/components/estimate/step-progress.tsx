import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Device", "Issue", "Drop-off", "Contact"];

export function StepProgress({ current }: { current: number }) {
  return (
    <ol className="flex items-center justify-between">
      {STEPS.map((label, index) => {
        const stepNumber = index + 1;
        const isDone = stepNumber < current;
        const isActive = stepNumber === current;

        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                  isDone && "border-brand-red bg-brand-red text-white",
                  isActive &&
                    "border-brand-red text-brand-red bg-brand-red/10",
                  !isDone && !isActive && "border-border text-muted-foreground"
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : stepNumber}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:block",
                  isActive || isDone ? "text-brand-navy" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {stepNumber !== STEPS.length && (
              <span
                className={cn(
                  "mx-2 h-0.5 flex-1 rounded-full transition-colors sm:mx-3",
                  isDone ? "bg-brand-red" : "bg-border"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
