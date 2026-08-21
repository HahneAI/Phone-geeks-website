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

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service) => (
          <Card
            key={service.title}
            className="group p-6 transition-all hover:-translate-y-1 hover:border-brand-blue/40 hover:shadow-lg"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blue-light text-brand-blue transition-colors group-hover:bg-brand-navy group-hover:text-white">
              <service.icon className="h-5 w-5" strokeWidth={2} />
            </span>
            <h3 className="mt-4 font-semibold text-brand-navy">
              {service.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {service.description}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
