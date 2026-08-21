import { Hero } from "@/components/home/hero";
import { RepairStrip } from "@/components/home/repair-strip";
import { ServicesGrid } from "@/components/home/services-grid";
import { Testimonials } from "@/components/home/testimonials";
import { Warranty } from "@/components/home/warranty";
import { CtaBanner } from "@/components/home/cta-banner";

export default function Home() {
  return (
    <>
      <Hero />
      <RepairStrip />
      <ServicesGrid />
      <Testimonials />
      <Warranty />
      <CtaBanner />
    </>
  );
}
