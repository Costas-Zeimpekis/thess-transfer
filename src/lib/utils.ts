import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Parses a naive ISO datetime string (e.g. "2026-07-14T21:00:00") as Europe/Athens local time
// and returns the corresponding UTC Date.
// Greece is EEST (UTC+3) from last Sunday in March to last Sunday in October, EET (UTC+2) otherwise.
// We determine DST by probing: try +03:00, then check if Intl confirms that offset; fall back to +02:00.
export function parseAthensDatetime(naive: string): Date {
  const probe3 = new Date(naive + "+03:00");
  const athensHour3 = parseInt(
    new Intl.DateTimeFormat("en", {
      timeZone: "Europe/Athens",
      hour: "2-digit",
      hour12: false,
    })
      .formatToParts(probe3)
      .find((p) => p.type === "hour")?.value ?? "0",
  );
  const utcHour3 = probe3.getUTCHours();
  const offset = (athensHour3 - utcHour3 + 24) % 24 === 3 ? "+03:00" : "+02:00";
  return new Date(naive + offset);
}
