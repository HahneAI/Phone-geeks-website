export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqCategory {
  title: string;
  items: FaqItem[];
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    title: "Warranty & Payment",
    items: [
      {
        question: "What does the warranty cover?",
        answer:
          "Every repair comes with a 1-year warranty on parts and labor. It doesn't cover liquid damage or damage that happens after the repair from normal drops or wear.",
      },
      {
        question: "Do I have to pay upfront?",
        answer:
          "No prepayment. You only pay once your repair is finished and you've had a chance to check it over.",
      },
      {
        question: "How is the price determined?",
        answer:
          "Price is the cost of the replacement part plus labor. We'll always give you the total before we start any work — no surprises at pickup.",
      },
    ],
  },
  {
    title: "Repair Process",
    items: [
      {
        question: "How long does water damage repair take?",
        answer:
          "It depends on how bad the damage is, but most water damage repairs take 24–72 hours — we need to fully dry and test the device before we put it back together.",
      },
    ],
  },
  {
    title: "What We Repair",
    items: [
      {
        question: "Do you repair iPads and tablets?",
        answer:
          "Yes — screen, battery, and charging port repairs for iPads and most Android tablets.",
      },
      {
        question: "Do you work on desktop and laptop computers?",
        answer:
          "Yes, both Mac and Windows. We handle hardware issues like screens, batteries, and keyboards, plus software issues like viruses, slow performance, and data recovery.",
      },
      {
        question: "Do you repair older game consoles?",
        answer:
          "Yes — we still fix older systems like the PSP, Nintendo DS, and Wii U, not just current-gen consoles.",
      },
    ],
  },
];
