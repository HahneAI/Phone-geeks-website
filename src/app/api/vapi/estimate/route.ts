import { handleVapiTools, type VapiToolCall } from "@/lib/vapi";
import { SERVICE_CATEGORIES } from "@/lib/services-data";
import { SYMPTOMS_BY_CATEGORY } from "@/lib/diagnose-data";

/**
 * Reuses the exact same symptom -> repair mapping as the /diagnose page,
 * so "how much to fix a cracked screen" gets the identical answer on the
 * phone as it does in the browser.
 */
function matchCategory(input: string) {
  const q = input.toLowerCase().trim();
  return (
    SERVICE_CATEGORIES.find(
      (c) =>
        c.slug === q ||
        c.shortLabel.toLowerCase() === q ||
        c.title.toLowerCase().includes(q) ||
        q.includes(c.shortLabel.toLowerCase())
    ) ?? null
  );
}

function matchSymptom(categorySlug: string, issueText: string) {
  const symptoms = SYMPTOMS_BY_CATEGORY[categorySlug] ?? [];
  const q = issueText.toLowerCase();

  let best = null as (typeof symptoms)[number] | null;
  let bestScore = 0;
  for (const symptom of symptoms) {
    const words = symptom.label.toLowerCase().split(/\W+/).filter(Boolean);
    const score = words.filter((w) => w.length > 2 && q.includes(w)).length;
    if (score > bestScore) {
      bestScore = score;
      best = symptom;
    }
  }
  return bestScore > 0 ? best : null;
}

function getEstimate(call: VapiToolCall) {
  const { device_category, issue } = call.arguments;
  const category = matchCategory(String(device_category ?? ""));

  if (!category || category.repairs.length === 0) {
    return "I'm not sure which device type that is — is it a phone, computer, tablet, or game console?";
  }

  const symptom = matchSymptom(category.slug, String(issue ?? ""));
  const repair = symptom
    ? category.repairs.find((r) => r.name === symptom.repairName)
    : null;

  if (!repair || !symptom) {
    return `I don't have a specific match for that on a ${category.shortLabel} — a tech would need to take a quick look in person, which is free. Want me to set up an appointment?`;
  }

  return {
    device: category.title,
    likelyIssue: repair.name,
    priceRange: repair.priceRange,
    turnaround: repair.turnaround,
    reasoning: symptom.reasoning,
    disclaimer:
      "This is a likely-issue estimate, not a final quote — a tech confirms it in person before any work starts.",
  };
}

export async function POST(req: Request) {
  return handleVapiTools(req, getEstimate);
}
