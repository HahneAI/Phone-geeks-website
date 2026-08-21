import { ShieldCheck, RotateCcw, Package } from "lucide-react";

const ITEMS = [
  {
    icon: ShieldCheck,
    title: "1 Year",
    subtitle: "Repairs",
    description: "Parts and labor covered for a full year on every repair.",
  },
  {
    icon: RotateCcw,
    title: "60 Days",
    subtitle: "Sales",
    description: "Full return window on any device we sell.",
  },
  {
    icon: Package,
    title: "3 Days",
    subtitle: "Accessories",
    description: "Short and simple return policy on accessories.",
  },
];

export function Warranty() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="rounded-3xl bg-brand-blue-light px-6 py-14 sm:px-14">
        <div className="max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight text-brand-navy">
            We stand behind every repair
          </h2>
          <p className="mt-3 text-muted-foreground">
            No fine print gotchas. Here&rsquo;s exactly what&rsquo;s covered
            &mdash; liquid and user damage excluded.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {ITEMS.map((item) => (
            <div
              key={item.title}
              className="flex flex-col items-center rounded-2xl border-2 border-transparent bg-white p-8 text-center shadow-sm transition-all hover:-translate-y-1.5 hover:border-brand-red/50 hover:shadow-xl"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red">
                <item.icon className="h-7 w-7" strokeWidth={2} />
              </span>
              <p className="mt-5 text-2xl font-bold text-brand-navy">
                {item.title}
              </p>
              <p className="text-sm font-semibold text-brand-blue">
                {item.subtitle}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
