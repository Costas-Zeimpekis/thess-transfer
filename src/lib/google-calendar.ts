import { auth as googleAuth, calendar as googleCalendar } from "@googleapis/calendar";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookingHistory, bookings, drivers, vehicles } from "@/lib/db/schema";

// The company's main calendar. Every confirmed booking gets an event here,
// independent of any driver assignment.
const MAIN_CALENDAR_ID = "raptis79@gmail.com";

function getCalendarClient() {
  const auth = new googleAuth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CALENDAR_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_CALENDAR_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/calendar.events"],
  });
  return googleCalendar({ version: "v3", auth });
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
  passengerCount: number | null;
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
  if (booking.status === "cancelled") return "8"; // Graphite
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
    `Επιβάτες: ${booking.passengerCount ?? "—"}`,
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
  // Event ends at `endTime` (ημερομηνία λήξης). Falls back to arrival + 1h when
  // no end time is set, or when the end time is not after the start (bad data) —
  // otherwise Google rejects the event with "The specified time range is empty."
  let end = booking.endTime
    ? new Date(booking.endTime)
    : new Date(start.getTime() + 60 * 60 * 1000);
  if (end.getTime() <= start.getTime()) {
    end = new Date(start.getTime() + 60 * 60 * 1000);
  }

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

async function resolveEventId(
  bookingId: number,
  stored: string | null,
  action = "calendar_event_created",
): Promise<string | null> {
  if (stored) return stored;
  const rows = await db
    .select({ changes: bookingHistory.changes })
    .from(bookingHistory)
    .where(
      and(
        eq(bookingHistory.bookingId, bookingId),
        eq(bookingHistory.action, action),
      ),
    )
    .orderBy(desc(bookingHistory.createdAt))
    .limit(1);
  return (rows[0]?.changes as Record<string, string> | null)?.eventId ?? null;
}

// Creates the main company calendar event for a booking, or updates it if one
// already exists. Stores googleCalendarMainEventId on the booking and logs to
// history on create. Only creates when `createIfMissing` is true (i.e. the
// booking is confirmed or later); always updates an event that already exists.
export async function syncMainCalendarEvent(
  booking: BookingForCalendar & { googleCalendarMainEventId: string | null },
  opts: { changedBy: number | null; source: "manual" | "automatic" },
  createIfMissing: boolean,
): Promise<void> {
  const eventId = await resolveEventId(
    booking.id,
    booking.googleCalendarMainEventId,
    "main_calendar_event_created",
  );
  if (eventId) {
    await updateBookingCalendarEvent(MAIN_CALENDAR_ID, eventId, booking).catch(
      () => null,
    );
    if (!booking.googleCalendarMainEventId) {
      await db
        .update(bookings)
        .set({ googleCalendarMainEventId: eventId })
        .where(eq(bookings.id, booking.id));
    }
    return;
  }
  if (!createIfMissing) return;

  const calResult = await createBookingCalendarEvent(MAIN_CALENDAR_ID, booking)
    .then((id) => ({ ok: true as const, eventId: id }))
    .catch((err: Error) => ({ ok: false as const, error: err?.message ?? String(err) }));
  if (calResult.ok && calResult.eventId) {
    await db
      .update(bookings)
      .set({ googleCalendarMainEventId: calResult.eventId })
      .where(eq(bookings.id, booking.id));
  }
  await db.insert(bookingHistory).values({
    bookingId: booking.id,
    action: calResult.ok
      ? "main_calendar_event_created"
      : "main_calendar_event_failed",
    source: opts.source,
    changedBy: opts.changedBy,
    changes: calResult.ok
      ? { calendarId: MAIN_CALENDAR_ID, eventId: calResult.eventId }
      : { calendarId: MAIN_CALENDAR_ID, error: calResult.error },
  });
}

// Syncs both calendars for a booking: the main company calendar (created once
// the booking is confirmed, updated thereafter) and the driver's calendar
// (created on assignment, updated thereafter).
export async function syncBookingCalendars(
  booking: BookingForCalendar & {
    driverId: number | null;
    googleCalendarEventId: string | null;
    googleCalendarMainEventId: string | null;
  },
  opts: { changedBy: number | null; source: "manual" | "automatic" },
): Promise<void> {
  const active =
    booking.status === "confirmed" ||
    booking.status === "assigned" ||
    booking.status === "completed";
  await syncMainCalendarEvent(booking, opts, active);
  await syncBookingCalendarEvent(booking, opts);
}

// Creates the driver's Google Calendar event for a booking, or updates it if one
// already exists. Stores the event id on the booking and logs to history on create.
// No-op when the booking has no driver or the driver has no calendar configured.
export async function syncBookingCalendarEvent(
  booking: BookingForCalendar & {
    driverId: number | null;
    googleCalendarEventId: string | null;
  },
  opts: { changedBy: number | null; source: "manual" | "automatic" },
): Promise<void> {
  if (!booking.driverId) return;
  const [driver] = await db
    .select({ googleCalendarId: drivers.googleCalendarId })
    .from(drivers)
    .where(eq(drivers.id, booking.driverId))
    .limit(1);
  const calId = driver?.googleCalendarId;
  if (!calId) return;

  const eventId = await resolveEventId(booking.id, booking.googleCalendarEventId);
  if (eventId) {
    await updateBookingCalendarEvent(calId, eventId, booking).catch(() => null);
    if (!booking.googleCalendarEventId) {
      await db
        .update(bookings)
        .set({ googleCalendarEventId: eventId })
        .where(eq(bookings.id, booking.id));
    }
    return;
  }

  const calResult = await createBookingCalendarEvent(calId, booking)
    .then((id) => ({ ok: true as const, eventId: id }))
    .catch((err: Error) => ({ ok: false as const, error: err?.message ?? String(err) }));
  if (calResult.ok && calResult.eventId) {
    await db
      .update(bookings)
      .set({ googleCalendarEventId: calResult.eventId })
      .where(eq(bookings.id, booking.id));
  }
  await db.insert(bookingHistory).values({
    bookingId: booking.id,
    action: calResult.ok ? "calendar_event_created" : "calendar_event_failed",
    source: opts.source,
    changedBy: opts.changedBy,
    changes: calResult.ok
      ? { calendarId: calId, eventId: calResult.eventId }
      : { calendarId: calId, error: calResult.error },
  });
}

const CANCELLED_PREFIX = "❌ ΑΚΥΡΩΘΗΚΕ — ";

// Marks a single calendar event as cancelled by keeping it visible but prepending
// a "cancelled" marker to its title and greying it out (Graphite). Google Calendar
// has no strikethrough.
async function cancelSingleEvent(
  calId: string,
  eventId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const calendar = getCalendarClient();
  return calendar.events
    .get({ calendarId: calId, eventId })
    .then((ev) => {
      const current = ev.data.summary ?? "";
      const summary = current.startsWith(CANCELLED_PREFIX)
        ? current
        : `${CANCELLED_PREFIX}${current}`;
      return calendar.events.patch({
        calendarId: calId,
        eventId,
        requestBody: { summary, colorId: "8" }, // Graphite
      });
    })
    .then(() => ({ ok: true as const }))
    .catch((err: Error) => ({ ok: false as const, error: err?.message ?? String(err) }));
}

// Cancels only the driver's calendar event. Used when a driver is removed from a
// booking that itself stays active (partner reassignment / unassignment).
// No-op when the booking has no driver, driver calendar, or linked event.
export async function markDriverCalendarEventCancelled(
  booking: {
    id: number;
    driverId: number | null;
    googleCalendarEventId: string | null;
  },
  opts: { changedBy: number | null; source: "manual" | "automatic" },
): Promise<void> {
  if (!booking.driverId) return;
  const eventId = await resolveEventId(booking.id, booking.googleCalendarEventId);
  if (!eventId) return;
  const [driver] = await db
    .select({ googleCalendarId: drivers.googleCalendarId })
    .from(drivers)
    .where(eq(drivers.id, booking.driverId))
    .limit(1);
  const calId = driver?.googleCalendarId;
  if (!calId) return;

  const res = await cancelSingleEvent(calId, eventId);
  await db.insert(bookingHistory).values({
    bookingId: booking.id,
    action: res.ok ? "calendar_event_cancelled" : "calendar_event_cancel_failed",
    source: opts.source,
    changedBy: opts.changedBy,
    changes: res.ok
      ? { calendarId: calId, eventId }
      : { calendarId: calId, error: res.error },
  });
}

// Cancels both the main company calendar event and the driver's calendar event
// when a whole booking is cancelled. No-op per calendar when no event exists.
export async function markBookingCalendarEventCancelled(
  booking: {
    id: number;
    driverId: number | null;
    googleCalendarEventId: string | null;
    googleCalendarMainEventId: string | null;
  },
  opts: { changedBy: number | null; source: "manual" | "automatic" },
): Promise<void> {
  const mainEventId = await resolveEventId(
    booking.id,
    booking.googleCalendarMainEventId,
    "main_calendar_event_created",
  );
  if (mainEventId) {
    const res = await cancelSingleEvent(MAIN_CALENDAR_ID, mainEventId);
    await db.insert(bookingHistory).values({
      bookingId: booking.id,
      action: res.ok
        ? "main_calendar_event_cancelled"
        : "main_calendar_event_cancel_failed",
      source: opts.source,
      changedBy: opts.changedBy,
      changes: res.ok
        ? { calendarId: MAIN_CALENDAR_ID, eventId: mainEventId }
        : { calendarId: MAIN_CALENDAR_ID, error: res.error },
    });
  }
  await markDriverCalendarEventCancelled(booking, opts);
}
