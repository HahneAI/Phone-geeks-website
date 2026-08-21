import {
  BatteryCharging,
  Plug,
  ScanLine,
  Camera,
  Volume2,
  Mic,
} from "lucide-react";

const REPAIRS = [
  { icon: BatteryCharging, label: "Battery Replacement" },
  { icon: Plug, label: "Charging Problem" },
  { icon: ScanLine, label: "Cracked Screen" },
  { icon: Camera, label: "Camera Replacement" },
  { icon: Volume2, label: "Speaker Repair" },
  { icon: Mic, label: "Microphone Issue" },
];

export function RepairStrip() {
  return (
    <section className="border-y border-border bg-surface-muted">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Common repairs we handle every day
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {REPAIRS.map((repair) => (
            <div
              key={repair.label}
              className="flex flex-col items-center gap-2 rounded-xl bg-surface px-3 py-5 text-center shadow-sm ring-1 ring-border"
            >
              <repair.icon className="h-6 w-6 text-brand-red" strokeWidth={2} />
              <span className="text-xs font-medium text-brand-navy">
                {repair.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
