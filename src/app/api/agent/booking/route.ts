import { and, eq, isNull, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { verifyAgentRequest } from "@/lib/agent-auth";
import { db } from "@/lib/db";
import {
  bookingHistory,
  bookings,
  providerEmails,
  systemLogs,
} from "@/lib/db/schema";
import { parseAthensDatetime } from "@/lib/utils";
import { markBookingCalendarEventCancelled } from "@/lib/google-calendar";

async function log(
  level: string,
  source: string,
  message: string,
  payload: unknown,
) {
  await db.insert(systemLogs).values({ level, source, message, payload });
}
async function logError(source: string, message: string, payload: unknown) {
  await log("error", source, message, payload);
}

async function resolveProviderId(
  provider_email?: string | null,
  provider_id?: number | null,
): Promise<number | null> {
  if (provider_id) return provider_id;
  if (!provider_email) return null;
  const rows = await db
    .select({ providerId: providerEmails.providerId })
    .from(providerEmails)
    .where(eq(providerEmails.email, provider_email))
    .limit(1);
  return rows[0]?.providerId ?? null;
}

// POST — create booking
export async function POST(request: Request) {
  if (!(await verifyAgentRequest(request))) {
    await log(
      "error",
      "POST /api/agent/booking",
      "Unauthorized request — invalid or missing API key",
      { ip: request.headers.get("x-forwarded-for") },
    );
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    provider_email,
    provider_id,
    provider_booking_ref,
    pickup_datetime,
    flight_number,
    pickup_location,
    dropoff_location,
    passenger_count,
    vehicle_type,
    baby_seat,
    booster_seat,
    customer_name,
    customer_phone,
    customer_email,
    payment_method,
    notes,
    real_price,
    is_return_trip,
  } = body;

  if (
    !pickup_datetime ||
    !pickup_location ||
    !dropoff_location ||
    !vehicle_type ||
    !customer_name
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const resolvedProviderId = await resolveProviderId(
    provider_email,
    provider_id,
  );

  if ((provider_email || provider_id) && !resolvedProviderId) {
    await logError(
      "POST /api/agent/booking",
      `Provider not found for email "${provider_email}"`,
      body,
    );
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  const resolvedRef = provider_booking_ref ?? `AGENT-${Date.now()}`;

  const duplicateWhere = resolvedProviderId
    ? and(
        eq(bookings.providerId, resolvedProviderId),
        eq(bookings.providerBookingRef, resolvedRef),
      )
    : and(
        isNull(bookings.providerId),
        eq(bookings.providerBookingRef, resolvedRef),
      );

  const duplicate = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(duplicateWhere)
    .limit(1);

  if (duplicate.length > 0) {
    await log(
      "error",
      "POST /api/agent/booking",
      `Duplicate booking ref "${resolvedRef}" for provider id ${resolvedProviderId ?? "none"} — rejected`,
      body,
    );
    return NextResponse.json(
      {
        error: `Booking ref "${resolvedRef}" already exists for this provider`,
      },
      { status: 409 },
    );
  }

  let booking;
  try {
    const result = await db
      .insert(bookings)
      .values({
        providerBookingRef: resolvedRef,
        providerId: resolvedProviderId,
        source: "automatic",
        status: "pending",
        arrivalDatetime: parseAthensDatetime(pickup_datetime),
        flightNumber: flight_number ?? null,
        pickupLocation: pickup_location,
        dropoffLocation: dropoff_location,
        passengerCount: passenger_count ?? 1,
        vehicleType: vehicle_type,
        babySeat: baby_seat ?? 0,
        boosterSeat: booster_seat ?? 0,
        customerName: customer_name,
        customerPhone: customer_phone ?? null,
        customerEmail: customer_email ?? null,
        paymentMethod: payment_method ?? null,
        notes: notes ?? null,
        realPrice: real_price != null ? String(real_price) : null,
        isReturnTrip: is_return_trip ?? false,
        approved: true, // API bookings are auto-approved (visible to admin)
      })
      .returning();
    booking = result[0];
  } catch (err: unknown) {
    // PostgreSQL unique constraint violation (race condition: two identical requests in flight)
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "23505"
    ) {
      await log(
        "error",
        "POST /api/agent/booking",
        `Duplicate booking ref "${resolvedRef}" (race condition) for provider id ${resolvedProviderId ?? "none"} — rejected`,
        body,
      );
      return NextResponse.json(
        {
          error: `Booking ref "${resolvedRef}" already exists for this provider`,
        },
        { status: 409 },
      );
    }
    throw err;
  }

  await db.insert(bookingHistory).values({
    bookingId: booking.id,
    action: "created",
    source: "automatic",
    changedBy: null,
    changes: null,
  });

  await log(
    "info",
    "POST /api/agent/booking",
    `Booking #${booking.id} created (ref: ${booking.providerBookingRef})`,
    { bookingId: booking.id, ref: booking.providerBookingRef, body },
  );

  return NextResponse.json(booking, { status: 201 });
}

// PUT — partial update by provider_email/provider_id + provider_booking_ref
export async function PUT(request: Request) {
  if (!(await verifyAgentRequest(request))) {
    await log(
      "error",
      "PUT /api/agent/booking",
      "Unauthorized request — invalid or missing API key",
      { ip: request.headers.get("x-forwarded-for") },
    );
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    provider_email,
    provider_id,
    provider_booking_ref,
    updated_provider_booking_ref,
    pickup_datetime,
    flight_number,
    pickup_location,
    dropoff_location,
    passenger_count,
    vehicle_type,
    baby_seat,
    booster_seat,
    customer_name,
    customer_phone,
    customer_email,
    payment_method,
    notes,
    real_price,
    is_return_trip,
  } = body;

  const missingIdentifiers = [
    !provider_booking_ref && "provider_booking_ref",
    !provider_email && !provider_id && "provider_email or provider_id",
  ].filter(Boolean);

  if (missingIdentifiers.length > 0) {
    return NextResponse.json(
      { error: "Missing required fields", fields: missingIdentifiers },
      { status: 400 },
    );
  }

  const resolvedProviderId = await resolveProviderId(
    provider_email,
    provider_id,
  );

  if (!resolvedProviderId) {
    await logError(
      "PUT /api/agent/booking",
      `Provider not found for email "${provider_email}"`,
      body,
    );
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  const existing = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.providerId, resolvedProviderId),
        eq(bookings.providerBookingRef, provider_booking_ref),
      ),
    )
    .limit(1);

  if (existing.length === 0) {
    await logError(
      "PUT /api/agent/booking",
      `Booking ref "${provider_booking_ref}" not found for provider id ${resolvedProviderId}`,
      body,
    );
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const current = existing[0];
  const hasField = (key: string) =>
    Object.prototype.hasOwnProperty.call(body as Record<string, unknown>, key);

  const nextProviderBookingRef =
    updated_provider_booking_ref ?? current.providerBookingRef;

  if (nextProviderBookingRef !== current.providerBookingRef) {
    const duplicateRef = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.providerId, resolvedProviderId),
          eq(bookings.providerBookingRef, nextProviderBookingRef),
          ne(bookings.id, current.id),
        ),
      )
      .limit(1);

    if (duplicateRef.length > 0) {
      await logError(
        "PUT /api/agent/booking",
        `Duplicate updated ref "${nextProviderBookingRef}" for provider id ${resolvedProviderId}`,
        body,
      );
      return NextResponse.json(
        {
          error: `Booking ref "${nextProviderBookingRef}" already exists for this provider`,
        },
        { status: 409 },
      );
    }
  }

  if (current.status === "completed" || current.status === "cancelled") {
    await logError(
      "PUT /api/agent/booking",
      `Cannot update booking #${current.id} with status "${current.status}"`,
      body,
    );
    return NextResponse.json(
      { error: "Cannot update a completed or cancelled booking" },
      { status: 409 },
    );
  }

  const hasAnyUpdateField =
    hasField("updated_provider_booking_ref") ||
    hasField("pickup_datetime") ||
    hasField("flight_number") ||
    hasField("pickup_location") ||
    hasField("dropoff_location") ||
    hasField("passenger_count") ||
    hasField("vehicle_type") ||
    hasField("baby_seat") ||
    hasField("booster_seat") ||
    hasField("customer_name") ||
    hasField("customer_phone") ||
    hasField("customer_email") ||
    hasField("payment_method") ||
    hasField("notes") ||
    hasField("real_price") ||
    hasField("is_return_trip");

  if (!hasAnyUpdateField) {
    return NextResponse.json(
      { error: "No update fields provided" },
      { status: 400 },
    );
  }

  const newValues = {
    providerId: resolvedProviderId,
    providerBookingRef: nextProviderBookingRef,
    arrivalDatetime: hasField("pickup_datetime")
      ? parseAthensDatetime(pickup_datetime)
      : current.arrivalDatetime,
    flightNumber: hasField("flight_number")
      ? (flight_number ?? null)
      : current.flightNumber,
    pickupLocation: hasField("pickup_location")
      ? pickup_location
      : current.pickupLocation,
    dropoffLocation: hasField("dropoff_location")
      ? dropoff_location
      : current.dropoffLocation,
    passengerCount: hasField("passenger_count")
      ? (passenger_count ?? 1)
      : current.passengerCount,
    vehicleType: hasField("vehicle_type") ? vehicle_type : current.vehicleType,
    babySeat: hasField("baby_seat") ? (baby_seat ?? 0) : current.babySeat,
    boosterSeat: hasField("booster_seat")
      ? (booster_seat ?? 0)
      : current.boosterSeat,
    customerName: hasField("customer_name")
      ? customer_name
      : current.customerName,
    customerPhone: hasField("customer_phone")
      ? (customer_phone ?? null)
      : current.customerPhone,
    customerEmail: hasField("customer_email")
      ? (customer_email ?? null)
      : current.customerEmail,
    paymentMethod: hasField("payment_method")
      ? (payment_method ?? null)
      : current.paymentMethod,
    notes: hasField("notes") ? (notes ?? null) : current.notes,
    realPrice: hasField("real_price")
      ? real_price != null
        ? String(real_price)
        : null
      : current.realPrice,
    isReturnTrip: hasField("is_return_trip")
      ? (is_return_trip ?? false)
      : current.isReturnTrip,
    updatedAt: new Date(),
  };

  const changes: Record<string, { from: unknown; to: unknown }> = {};
  const trackFields: Array<[string, keyof typeof current, unknown]> = [
    ["provider_id", "providerId", newValues.providerId],
    [
      "provider_booking_ref",
      "providerBookingRef",
      newValues.providerBookingRef,
    ],
    ["pickup_datetime", "arrivalDatetime", newValues.arrivalDatetime],
    ["flight_number", "flightNumber", newValues.flightNumber],
    ["pickup_location", "pickupLocation", newValues.pickupLocation],
    ["dropoff_location", "dropoffLocation", newValues.dropoffLocation],
    ["passenger_count", "passengerCount", newValues.passengerCount],
    ["vehicle_type", "vehicleType", newValues.vehicleType],
    ["baby_seat", "babySeat", newValues.babySeat],
    ["booster_seat", "boosterSeat", newValues.boosterSeat],
    ["customer_name", "customerName", newValues.customerName],
    ["customer_phone", "customerPhone", newValues.customerPhone],
    ["customer_email", "customerEmail", newValues.customerEmail],
    ["payment_method", "paymentMethod", newValues.paymentMethod],
    ["notes", "notes", newValues.notes],
    ["real_price", "realPrice", newValues.realPrice],
    ["is_return_trip", "isReturnTrip", newValues.isReturnTrip],
  ];
  for (const [key, dbKey, newVal] of trackFields) {
    if (String(current[dbKey]) !== String(newVal)) {
      changes[key] = { from: current[dbKey], to: newVal };
    }
  }

  const updatePayload: Record<string, unknown> = { ...newValues };

  // Revert confirmed to pending if pickup is in the future and something changed
  if (
    current.status === "confirmed" &&
    current.arrivalDatetime > new Date() &&
    Object.keys(changes).length > 0
  ) {
    updatePayload.status = "pending";
    updatePayload.driverId = null;
    updatePayload.vehicleId = null;
    updatePayload.partnerId = null;
    updatePayload.partnerAssignmentPrice = null;
    changes.status = { from: current.status, to: "pending" };
  }

  const result = await db
    .update(bookings)
    .set(updatePayload)
    .where(eq(bookings.id, current.id))
    .returning();

  await db.insert(bookingHistory).values({
    bookingId: current.id,
    action: "updated",
    source: "automatic",
    changedBy: null,
    changes,
  });

  await log(
    "info",
    "PUT /api/agent/booking",
    `Booking #${current.id} updated (ref: ${provider_booking_ref})`,
    { bookingId: current.id, changes, body },
  );

  return NextResponse.json(result[0]);
}

// PATCH — change status by provider_email + provider_booking_ref
export async function PATCH(request: Request) {
  if (!(await verifyAgentRequest(request))) {
    await log(
      "error",
      "PATCH /api/agent/booking",
      "Unauthorized request — invalid or missing API key",
      { ip: request.headers.get("x-forwarded-for") },
    );
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    provider_email,
    provider_id,
    provider_booking_ref,
    status: newStatus,
  } = body;

  if (
    (!provider_email && !provider_id) ||
    !provider_booking_ref ||
    !newStatus
  ) {
    return NextResponse.json(
      {
        error:
          "Missing required fields: provider_email or provider_id, provider_booking_ref, status",
      },
      { status: 400 },
    );
  }

  const resolvedProviderId = await resolveProviderId(
    provider_email,
    provider_id,
  );
  if (!resolvedProviderId) {
    await logError(
      "PATCH /api/agent/booking",
      `Provider not found for email "${provider_email}"`,
      body,
    );
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  const existing = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.providerId, resolvedProviderId),
        eq(bookings.providerBookingRef, provider_booking_ref),
      ),
    )
    .limit(1);

  if (existing.length === 0) {
    await logError(
      "PATCH /api/agent/booking",
      `Booking ref "${provider_booking_ref}" not found for provider id ${resolvedProviderId}`,
      body,
    );
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const current = existing[0];

  const ALLOWED: Record<string, string[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["pending", "completed", "cancelled"],
    assigned: ["cancelled"],
  };

  if (!(ALLOWED[current.status] ?? []).includes(newStatus)) {
    await logError(
      "PATCH /api/agent/booking",
      `Invalid status transition "${current.status}" → "${newStatus}" for booking #${current.id}`,
      body,
    );
    return NextResponse.json(
      { error: "Transition not allowed" },
      { status: 400 },
    );
  }

  const updateValues: Record<string, unknown> = {
    status: newStatus,
    updatedAt: new Date(),
  };
  if (newStatus === "completed") {
    updateValues.completedAt = new Date();
  }

  const result = await db
    .update(bookings)
    .set(updateValues)
    .where(eq(bookings.id, current.id))
    .returning();

  await db.insert(bookingHistory).values({
    bookingId: current.id,
    action: `status_changed_to_${newStatus}`,
    source: "automatic",
    changedBy: null,
    changes: { status: { from: current.status, to: newStatus } },
  });

  await log(
    "info",
    "PATCH /api/agent/booking",
    `Booking #${current.id} status: ${current.status} → ${newStatus} (ref: ${provider_booking_ref})`,
    { bookingId: current.id, from: current.status, to: newStatus, body },
  );

  if (newStatus === "cancelled") {
    await markBookingCalendarEventCancelled(result[0], {
      changedBy: null,
      source: "automatic",
    });
  }

  return NextResponse.json(result[0]);
}
