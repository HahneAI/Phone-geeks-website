import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ServiceCategory } from "@/lib/services-data";

export function CategorySection({ category }: { category: ServiceCategory }) {
  const { icon: Icon, title, description, repairs } = category;

  return (
    <section
      id={category.slug}
      className="mx-auto max-w-6xl scroll-mt-32 px-4 py-16 sm:px-6"
    >
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red">
          <Icon className="h-6 w-6" strokeWidth={2} />
        </span>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">
            {title}
          </h2>
          <p className="mt-1 max-w-2xl text-muted-foreground">{description}</p>
        </div>
      </div>

      {repairs.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {repairs.map((repair) => (
            <Card
              key={repair.name}
              className="flex flex-col justify-between p-5 transition-all hover:-translate-y-1 hover:border-brand-red/40 hover:shadow-md"
            >
              <h3 className="font-semibold text-brand-navy">{repair.name}</h3>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-bold text-brand-navy">
                  {repair.priceRange}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-red/10 px-2.5 py-1 text-xs font-semibold text-brand-red">
                  <Clock className="h-3 w-3" />
                  {repair.turnaround}
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-start gap-5 rounded-2xl border-2 border-border bg-surface-muted p-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-muted-foreground">
            No fixed price list here — stop by or start online and a geek will
            walk you through it.
          </p>
          <Button href="/estimate" variant="secondary" className="shrink-0">
            Get Started
          </Button>
        </div>
      )}
    </section>
  );
}
