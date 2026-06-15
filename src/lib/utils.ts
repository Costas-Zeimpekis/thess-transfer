import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Parses a naive ISO datetime string (e.g. "2026-07-14T21:00:00") as Europe/Athens local time
// and returns the corresponding UTC Date. Without this, JS treats the string as UTC, which
// causes a 2–3 hour offset when displaying in Athens timezone.
export function parseAthensDatetime(naive: string): Date {
  const dt = new Date(naive + "Z");
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Europe/Athens",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(dt);
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value ?? 0);
  const athensAsUtcMs = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return new Date(dt.getTime() - (athensAsUtcMs - dt.getTime()));
}
