/**
 * Hours below are a reasonable placeholder for the demo (brief didn't include
 * real operating hours) — swap for the shop's actual schedule before launch.
 */
export interface DaySchedule {
  open: number;
  close: number;
}

/** Keyed by Date#getDay(): 0 = Sunday ... 6 = Saturday */
export type WeeklySchedule = Record<number, DaySchedule | null>;

export interface StoreLocation {
  slug: string;
  name: string;
  phone: string;
  address: string;
  schedule: WeeklySchedule;
}

const STANDARD_SCHEDULE: WeeklySchedule = {
  0: { open: 12, close: 17 }, // Sun
  1: { open: 10, close: 19 }, // Mon
  2: { open: 10, close: 19 },
  3: { open: 10, close: 19 },
  4: { open: 10, close: 19 },
  5: { open: 10, close: 19 },
  6: { open: 10, close: 19 }, // Sat
};

export const LOCATIONS: StoreLocation[] = [
  {
    slug: "arnold",
    name: "Arnold",
    phone: "636-333-3324",
    address: "141 Arnold Crossroads Center, Arnold, MO",
    schedule: STANDARD_SCHEDULE,
  },
  {
    slug: "ballwin",
    name: "Ballwin",
    phone: "636-256-1702",
    address: "14748 Manchester Rd, Ballwin, MO",
    schedule: STANDARD_SCHEDULE,
  },
];

export function formatSchedule(schedule: WeeklySchedule): string {
  const fmt = (h: number) =>
    h === 12 ? "12pm" : h > 12 ? `${h - 12}pm` : `${h}am`;
  const weekday = schedule[1];
  const sunday = schedule[0];
  if (!weekday || !sunday) return "Call for hours";
  return `Mon–Sat ${fmt(weekday.open)}–${fmt(weekday.close)}, Sun ${fmt(
    sunday.open
  )}–${fmt(sunday.close)}`;
}
