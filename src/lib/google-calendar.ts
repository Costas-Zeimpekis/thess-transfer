import { google } from "googleapis";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { vehicles } from "@/lib/db/schema";

function getCalendarClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CALENDAR_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_CALENDAR_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/calendar.events"],
  });
  return google.calendar({ version: "v3", auth });
}

type BookingForCalendar = {
  id: number;
  providerBookingRef: string | null;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  arrivalDatetime: Date;
  endTime: Date | null;
  pickupLocation: string;
  dropoffLocation: string;
  flightNumber: string | null;
  passengerCount: number;
  vehicleType: string;
  babySeat: number | null;
  boosterSeat: number | null;
  paymentMethod: string | null;
  notes: string | null;
  realPrice: string | null;
  status: string;
  partnerId: number | null;
  vehicleId: number | null;
};

async function getVehicleLabel(vehicleId: number | null): Promise<string | null> {
  if (!vehicleId) return null;
  const rows = await db
    .select({ name: vehicles.name, plate: vehicles.plate, brand: vehicles.brand })
    .from(vehicles)
    .where(eq(vehicles.id, vehicleId))
    .limit(1);
  const v = rows[0];
  if (!v) return null;
  const label = [v.brand, v.name].filter(Boolean).join(" ");
  return label ? `${label} (${v.plate})` : v.plate;
}

function getEventColorId(booking: BookingForCalendar): string {
  if (booking.status === "cancelled") return "3"; // Grape
  if (booking.status === "assigned" && booking.partnerId != null) return "5"; // Banana
  if (booking.vehicleType === "van") return "11"; // Tomato
  if (booking.vehicleType === "bus") return "10"; // Basil
  return "7"; // Peacock — car (default)
}

function buildEventBody(booking: BookingForCalendar, vehicleLabel: string | null) {
  const ref = booking.providerBookingRef ?? `#${booking.id}`;
  const summary = `${ref} — ${booking.customerName} | ${booking.pickupLocation} → ${booking.dropoffLocation}`;

  const lines: (string | null)[] = [
    `Πελάτης: ${booking.customerName}`,
    booking.customerPhone ? `Τηλέφωνο: ${booking.customerPhone}` : null,
    booking.customerEmail ? `Email: ${booking.customerEmail}` : null,
    ``,
    `Παραλαβή: ${booking.pickupLocation}`,
    `Προορισμός: ${booking.dropoffLocation}`,
    booking.flightNumber ? `Πτήση: ${booking.flightNumber}` : null,
    ``,
    `Επιβάτες: ${booking.passengerCount}`,
    `Όχημα: ${booking.vehicleType}`,
    vehicleLabel ? `Αυτοκίνητο: ${vehicleLabel}` : null,
    booking.babySeat ? `Baby Seat: ${booking.babySeat}` : null,
    booking.boosterSeat ? `Booster Seat: ${booking.boosterSeat}` : null,
    ``,
    booking.paymentMethod ? `Πληρωμή: ${booking.paymentMethod}` : null,
    booking.realPrice ? `Τιμή: €${parseFloat(booking.realPrice).toFixed(2)}` : null,
    booking.notes ? `\nΣημειώσεις: ${booking.notes}` : null,
  ];

  const description = lines.filter(Boolean).join("\n");
  const start = new Date(booking.arrivalDatetime);
  // Event ends at `endTime` (ημερομηνία λήξης).
  // Falls back to arrival + 1h when no end time is set.
  const end = booking.endTime
    ? new Date(booking.endTime)
    : new Date(start.getTime() + 60 * 60 * 1000);

  return {
    summary,
    description,
    colorId: getEventColorId(booking),
    start: { dateTime: start.toISOString(), timeZone: "Europe/Athens" },
    end:   { dateTime: end.toISOString(),   timeZone: "Europe/Athens" },
  };
}

export async function createBookingCalendarEvent(
  calendarId: string,
  booking: BookingForCalendar,
): Promise<string | null> {
  const calendar = getCalendarClient();
  const vehicleLabel = await getVehicleLabel(booking.vehicleId);
  const result = await calendar.events.insert({
    calendarId,
    requestBody: buildEventBody(booking, vehicleLabel),
  });
  return result.data.id ?? null;
}

export async function updateBookingCalendarEvent(
  calendarId: string,
  eventId: string,
  booking: BookingForCalendar,
): Promise<void> {
  const calendar = getCalendarClient();
  const vehicleLabel = await getVehicleLabel(booking.vehicleId);
  await calendar.events.update({
    calendarId,
    eventId,
    requestBody: buildEventBody(booking, vehicleLabel),
  });
}
