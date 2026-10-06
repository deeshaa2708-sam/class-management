import { Day } from "@prisma/client";

/** Convert "09:00" to minutes-since-midnight */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Convert minutes-since-midnight back to "HH:MM" */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Map JS Date.getDay() (0=Sun) to Prisma Day enum */
const DAY_MAP: Record<number, Day> = {
  0: Day.SUNDAY,
  1: Day.MONDAY,
  2: Day.TUESDAY,
  3: Day.WEDNESDAY,
  4: Day.THURSDAY,
  5: Day.FRIDAY,
  6: Day.SATURDAY,
};

export function dateToDayEnum(date: Date): Day {
  return DAY_MAP[date.getDay()];
}

/** Monday of the current ISO week */
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // adjust so Monday = 0
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Check overlap between two time ranges */
export function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && e1 > s2;
}

/** Interpolate a WhatsApp template with actual values */
export function interpolateTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/{(\w+)}/g, (_, key) => vars[key] ?? `{${key}}`);
}
