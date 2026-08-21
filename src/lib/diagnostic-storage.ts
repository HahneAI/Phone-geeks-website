/**
 * Persists the most recent completed diagnostic quiz run so the Estimate
 * flow can offer to reuse it. Deliberately uses localStorage rather than
 * sessionStorage: sessionStorage is scoped to a single tab, while
 * localStorage is shared across every tab and survives navigating away
 * and back — which is the point here (finish the diagnostic in one tab,
 * pick it back up on the Estimate page in another).
 *
 * Only a finished diagnostic run gets saved (the diagnostic quiz only
 * calls saveDiagnosis() once it reaches its result step) — partial quiz
 * progress is never persisted.
 */

import { useSyncExternalStore } from "react";

export const DIAGNOSIS_STORAGE_KEY = "pg_last_diagnosis";

export interface StoredDiagnosis {
  categorySlug: string;
  categoryTitle: string;
  /** Natural-language name for use in a sentence, e.g. "for your {categoryShortLabel}" */
  categoryShortLabel: string;
  symptomLabel: string;
  repairName: string;
  priceRange: string;
  turnaround: string;
  reasoning: string;
  savedAt: string;
}

export function saveDiagnosis(data: Omit<StoredDiagnosis, "savedAt">) {
  if (typeof window === "undefined") return;
  try {
    const record: StoredDiagnosis = { ...data, savedAt: new Date().toISOString() };
    window.localStorage.setItem(DIAGNOSIS_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Storage unavailable (private browsing, quota, disabled) — this is a
    // nice-to-have convenience feature, so fail silently rather than break
    // the diagnostic result screen over it.
  }
}

export function getDiagnosis(): StoredDiagnosis | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DIAGNOSIS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredDiagnosis;
  } catch {
    return null;
  }
}

export function clearDiagnosis() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DIAGNOSIS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// --- Live-reading hook -----------------------------------------------
//
// useSyncExternalStore (rather than reading localStorage in a useEffect +
// setState) does two things for us at once:
//  1. No hydration mismatch: it renders the server snapshot (always null,
//     since there's no localStorage server-side) during hydration, then
//     synchronously swaps to the real client value right after — the
//     standard React-endorsed pattern for this, and it sidesteps the
//     "don't setState directly in an effect" lint rule entirely, since
//     there's no effect involved.
//  2. Cross-tab live updates for free: the native "storage" event fires in
//     every other same-origin tab (never the tab that wrote the value),
//     so subscribing to it is exactly the mechanism for "another tab
//     finished a diagnostic while this tab already has the page open."

let cachedRaw: string | null = null;
let cachedSnapshot: StoredDiagnosis | null = null;

function getSnapshot(): StoredDiagnosis | null {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(DIAGNOSIS_STORAGE_KEY);
  } catch {
    raw = null;
  }
  // Only re-parse (and return a new object reference) when the raw value
  // actually changed — useSyncExternalStore compares snapshots with
  // Object.is, so returning a fresh object every call would look like a
  // change on every render and spin.
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedSnapshot = raw ? (JSON.parse(raw) as StoredDiagnosis) : null;
    } catch {
      cachedSnapshot = null;
    }
  }
  return cachedSnapshot;
}

function getServerSnapshot(): StoredDiagnosis | null {
  return null;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function useStoredDiagnosis(): StoredDiagnosis | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
