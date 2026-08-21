import {
  Smartphone,
  Laptop,
  Recycle,
  ShoppingBag,
  ShieldCheck,
  Wrench,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";

const SERVICES = [
  {
    icon: Users,
    title: "Consult a Geek",
    description:
      "Not sure what's wrong? Bring it in — we'll diagnose it in person, free, no appointment needed.",
  },
  {
    icon: Smartphone,
    title: "Smart Phone Repair",
    description:
      "Cracked screens, dead batteries, charging ports, cameras, speakers — most fixed same day.",
  },
  {
    icon: Laptop,
    title: "Macbook & Computer Repair",
    description:
      "Hardware and software repair for Mac and Windows laptops and desktops.",
  },
  {
    icon: Recycle,
    title: "Gadget Buyback & Recycling",
    description:
      "Trade in your old device for cash, or recycle it with us responsibly.",
  },
  {
    icon: ShoppingBag,
    title: "Retail",
    description:
      "Refurbished phones and accessories, tested and backed by our warranty.",
  },
  {
    icon: ShieldCheck,
    title: "Safe & Secure",
    description:
      "Your data stays yours. We never access personal files during a repair.",
  },
  {
    icon: Wrench,
    title: "Parts Quality",
    description:
      "We use quality-tested parts and stand behind every repair for a full year.",
  },
];

export function ServicesGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="max-w-xl">
        <h2 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
          Everything under one roof
        </h2>
        <p className="mt-3 text-muted-foreground">
          From a cracked screen to a full trade-in, our geeks handle it —
          honestly, and fast.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service, index) => (
          <Reveal key={service.title} delay={Math.min(index, 5) * 0.06}>
            <Card className="group flex h-full flex-col items-center border-2 p-8 text-center transition-all hover:-translate-y-1.5 hover:border-brand-red/50 hover:shadow-xl">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red transition-colors group-hover:bg-brand-red group-hover:text-white">
                <service.icon className="h-7 w-7" strokeWidth={2} />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-brand-navy">
                {service.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {service.description}
              </p>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
