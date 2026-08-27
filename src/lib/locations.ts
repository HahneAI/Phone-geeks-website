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

/** Real hours for both Arnold and Ballwin: closed Sundays, 11am–7pm Mon–Sat. */
const STANDARD_SCHEDULE: WeeklySchedule = {
  0: null, // Sun — closed
  1: { open: 11, close: 19 }, // Mon
  2: { open: 11, close: 19 },
  3: { open: 11, close: 19 },
  4: { open: 11, close: 19 },
  5: { open: 11, close: 19 },
  6: { open: 11, close: 19 }, // Sat
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
  if (!weekday) return "Call for hours";
  const sunday = schedule[0];
  const sundayLabel = sunday
    ? `, Sun ${fmt(sunday.open)}–${fmt(sunday.close)}`
    : ", closed Sun";
  return `Mon–Sat ${fmt(weekday.open)}–${fmt(weekday.close)}${sundayLabel}`;
}
