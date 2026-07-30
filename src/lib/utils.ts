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

// Validates that the booking end time is strictly after both the arrival datetime
// and the start time. A blank start time is ignored. Returns a Greek error message,
// or null when valid.
// Fields that must be present before a booking may leave "pending". Intake drops
// values that arrived with a corrupted encoding, so these can be blank on an
// otherwise valid automatic booking.
export function validateRequiredBookingFields(booking: {
  pickupLocation: string | null;
  dropoffLocation: string | null;
  customerName: string | null;
}): string | null {
  const missing = [
    !booking.pickupLocation?.trim() && "Τόπος Παραλαβής",
    !booking.dropoffLocation?.trim() && "Τόπος Αποστολής",
    !booking.customerName?.trim() && "Ονοματεπώνυμο",
  ].filter(Boolean);

  if (missing.length === 0) return null;
  return `Συμπληρώστε τα πεδία που λείπουν πριν την αλλαγή κατάστασης: ${missing.join(", ")}`;
}

export function validateBookingDates(dates: {
  arrivalDatetime: Date | null;
  startTime: Date | null;
  endTime: Date | null;
}): string | null {
  const { arrivalDatetime, startTime, endTime } = dates;
  if (!endTime) return null;
  if (startTime && endTime <= startTime) {
    return "Η ώρα λήξης πρέπει να είναι μεταγενέστερη της ώρας έναρξης";
  }
  if (arrivalDatetime && endTime <= arrivalDatetime) {
    return "Η ώρα λήξης πρέπει να είναι μεταγενέστερη της ώρας άφιξης";
  }
  return null;
}
