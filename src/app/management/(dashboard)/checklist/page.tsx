import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";

export const metadata: Metadata = {
  title: "Anthony's Checklist | Phone Geeks",
  robots: { index: false, follow: false },
};

// Blank placeholder — content TBD.
export default function ChecklistPage() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-black/15 bg-white px-6 py-16 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/5 text-black/40">
        <ClipboardList className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium text-black/60">
        Nothing here yet — placeholder page.
      </p>
    </div>
  );
}
