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
  if (!q) return null;
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

/**
 * Common English function words that happen to be 3+ letters — without
 * excluding these, `w.length > 2` alone lets a word like "the" (which
 * shows up twice in some symptom labels, e.g. "the screen is cracked or
 * the glass is broken") inflate a label's score just from ordinary
 * sentence structure, with nothing to do with the actual symptom.
 * Caught by testing real caller phrasing: "I dropped it in the toilet"
 * was matching "Screen Repair" (matched only on "the", scored higher
 * than the real "dropped ... liquid" water-damage symptom purely
 * because Screen's label contains "the" twice) instead of the water
 * damage symptom, before this list existed.
 */
const STOPWORDS = new Set([
  "the", "and", "for", "are", "was", "but", "not", "you", "your",
  "all", "any", "can", "had", "has", "her", "his", "one", "our",
  "out", "get", "its", "who", "did", "him", "she", "too", "how",
  "off", "own", "just", "that", "this", "with", "from", "have",
  "been", "were", "when", "what", "will", "would", "there", "their",
  "about", "right", "isn't", "isnt", "doesn't", "doesnt", "won't",
  "wont", "it's",
]);

/**
 * Real content words that are still too generic to identify *which*
 * repair a caller means on their own — "broken" is the one case that
 * shows up in this dataset's labels (only smartphone's Screen Repair:
 * "...or the glass is broken"), so a caller who just says "it's broken"
 * with no other detail was getting a confident Screen Repair quote
 * instead of the honest "come in for a free look" fallback. Checked
 * against every symptom `label` in diagnose-data.ts (not `reasoning`,
 * which isn't used for matching) before adding — this is deliberately
 * a short, evidence-based list, not a guess at every vague word that
 * might theoretically cause the same problem.
 */
const TOO_GENERIC = new Set(["broken"]);

function meaningfulWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w) && !TOO_GENERIC.has(w));
}

function matchSymptom(categorySlug: string, issueText: string) {
  const symptoms = SYMPTOMS_BY_CATEGORY[categorySlug] ?? [];
  const q = issueText.toLowerCase();

  let best = null as (typeof symptoms)[number] | null;
  let bestScore = 0;
  let tied = false;
  for (const symptom of symptoms) {
    const words = meaningfulWords(symptom.label);
    const score = words.filter((w) => q.includes(w)).length;
    if (score > bestScore) {
      bestScore = score;
      best = symptom;
      tied = false;
    } else if (score === bestScore && score > 0) {
      // Two different symptoms scored equally on real content words —
      // genuinely ambiguous phrasing, not a case to silently resolve by
      // array order. Falls through to the "no confident match" path
      // below, same as a caller getting the free in-person diagnostic
      // offer instead of a guessed answer.
      tied = true;
    }
  }
  return bestScore > 0 && !tied ? best : null;
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
