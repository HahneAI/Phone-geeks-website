import type { Metadata } from "next";
import { FaqHero } from "@/components/faq/faq-hero";
import { AccordionItem } from "@/components/faq/accordion-item";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FAQ_CATEGORIES } from "@/lib/faq-data";

export const metadata: Metadata = {
  title: "FAQ | Phone Geeks",
  description:
    "Answers to common questions about Phone Geeks' warranty, pricing, repair process, and what devices we fix in St. Louis.",
};

export default function FaqPage() {
  return (
    <>
      <FaqHero />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-10">
          {FAQ_CATEGORIES.map((category) => (
            <div key={category.title}>
              <h2 className="text-lg font-bold text-brand-navy">
                {category.title}
              </h2>
              <Card className="mt-4 px-6">
                {category.items.map((item) => (
                  <AccordionItem key={item.question} item={item} />
                ))}
              </Card>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl bg-brand-blue-light px-6 py-10 text-center">
          <p className="text-brand-navy">
            Still have a question? We&rsquo;re happy to talk it through.
          </p>
          <Button href="/contact" variant="secondary">
            Contact a Shop
          </Button>
        </div>
      </div>
    </>
  );
}
