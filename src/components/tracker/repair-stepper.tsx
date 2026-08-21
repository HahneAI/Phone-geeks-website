import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { TRACKER_STEPS, type DemoTicket } from "@/lib/tracker-data";

export function RepairStepper({ ticket }: { ticket: DemoTicket }) {
  return (
    <div>
      {/* Progress overview */}
      <ol className="flex items-start">
        {TRACKER_STEPS.map((label, index) => {
          const isDone = index < ticket.currentStep;
          const isActive = index === ticket.currentStep;

          return (
            <li key={label} className="flex flex-1 flex-col items-center last:flex-none">
              <div className="flex w-full items-center">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    isDone && "border-brand-red bg-brand-red text-white",
                    isActive && "border-brand-red bg-brand-red/10 text-brand-red",
                    !isDone && !isActive && "border-border text-muted-foreground"
                  )}
                >
                  {isDone ? (
                    <Check className="h-4 w-4" />
                  ) : isActive ? (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-red opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-red" />
                    </span>
                  ) : (
                    index + 1
                  )}
                </span>
                {index !== TRACKER_STEPS.length - 1 && (
                  <span
                    className={cn(
                      "mx-1 h-0.5 flex-1 rounded-full transition-colors sm:mx-2",
                      isDone ? "bg-brand-red" : "bg-border"
                    )}
                  />
                )}
              </div>
              <span
                className={cn(
                  "mt-2 hidden text-center text-xs font-medium sm:block",
                  isActive || isDone ? "text-brand-navy" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Event log */}
      <div className="mt-8 flex flex-col gap-5 border-t border-border pt-8">
        {TRACKER_STEPS.map((label, index) => {
          const event = ticket.events[index];
          const isActive = index === ticket.currentStep;
          if (!event) {
            return (
              <div key={label} className="flex items-start gap-3 opacity-40">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-border" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            );
          }

          return (
            <div key={label} className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-1 h-2 w-2 shrink-0 rounded-full",
                  isActive ? "bg-brand-red" : "bg-brand-navy"
                )}
              />
              <div>
                <p className="text-sm font-semibold text-brand-navy">{label}</p>
                <p className="text-sm text-muted-foreground">{event.note}</p>
                <p className="mt-0.5 text-xs text-muted-foreground/70">
                  {event.timestamp}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
