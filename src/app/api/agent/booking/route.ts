import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { verifyAgentRequest } from "@/lib/agent-auth";
import { db } from "@/lib/db";
import { bookingHistory, bookings, providerEmails, systemLogs } from "@/lib/db/schema";

async function logError(source: string, message: string, payload: unknown) {
  await db.insert(systemLogs).values({ level: "error", source, message, payload });
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

  const resolvedProviderId = await resolveProviderId(provider_email, provider_id);

  if ((provider_email || provider_id) && !resolvedProviderId) {
    await logError("POST /api/agent/booking", `Provider not found for email "${provider_email}"`, body);
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  const resolvedRef = provider_booking_ref ?? `AGENT-${Date.now()}`;

  const duplicateWhere = resolvedProviderId
    ? and(eq(bookings.providerId, resolvedProviderId), eq(bookings.providerBookingRef, resolvedRef))
    : and(isNull(bookings.providerId), eq(bookings.providerBookingRef, resolvedRef));

  const duplicate = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(duplicateWhere)
    .limit(1);

  if (duplicate.length > 0) {
    await db.insert(systemLogs).values({
      level: "warn",
      source: "POST /api/agent/booking",
      message: `Duplicate booking ref "${resolvedRef}" for provider id ${resolvedProviderId ?? "none"}`,
      payload: body,
    });
    return NextResponse.json(
      { error: `Booking ref "${resolvedRef}" already exists for this provider` },
      { status: 409 },
    );
  }

  const result = await db
    .insert(bookings)
    .values({
      providerBookingRef: resolvedRef,
      providerId: resolvedProviderId,
      source: "automatic",
      status: "pending",
      pickupDatetime: new Date(pickup_datetime),
      flightNumber: flight_number ?? null,
      pickupLocation: pickup_location,
      dropoffLocation: dropoff_location,
      passengerCount: passenger_count ?? 1,
      vehicleType: vehicle_type,
      babySeat: baby_seat ?? false,
      boosterSeat: booster_seat ?? false,
      customerName: customer_name,
      customerPhone: customer_phone ?? null,
      customerEmail: customer_email ?? null,
      paymentMethod: payment_method ?? null,
      notes: notes ?? null,
      realPrice: real_price != null ? String(real_price) : null,
      isReturnTrip: is_return_trip ?? false,
    })
    .returning();

  const booking = result[0];

  await db.insert(bookingHistory).values({
    bookingId: booking.id,
    action: "created",
    source: "automatic",
    changedBy: null,
    changes: null,
  });

  return NextResponse.json(booking, { status: 201 });
}

// PUT — full replacement of a booking by id (same body as POST + id)
export async function PUT(request: Request) {
  if (!(await verifyAgentRequest(request))) {
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

  const missing = [
    !provider_booking_ref && "provider_booking_ref",
    (!provider_email && !provider_id) && "provider_email or provider_id",
    !pickup_datetime && "pickup_datetime",
    !pickup_location && "pickup_location",
    !dropoff_location && "dropoff_location",
    !vehicle_type && "vehicle_type",
    !customer_name && "customer_name",
    passenger_count === undefined && "passenger_count",
    baby_seat === undefined && "baby_seat",
    booster_seat === undefined && "booster_seat",
    is_return_trip === undefined && "is_return_trip",
  ].filter(Boolean);

  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Missing required fields", fields: missing },
      { status: 400 },
    );
  }

  const resolvedProviderId = await resolveProviderId(provider_email, provider_id);

  if (!resolvedProviderId) {
    await logError("PUT /api/agent/booking", `Provider not found for email "${provider_email}"`, body);
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  const existing = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.providerId, resolvedProviderId), eq(bookings.providerBookingRef, provider_booking_ref)))
    .limit(1);

  if (existing.length === 0) {
    await logError("PUT /api/agent/booking", `Booking ref "${provider_booking_ref}" not found for provider id ${resolvedProviderId}`, body);
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const current = existing[0];

  if (current.status === "completed" || current.status === "cancelled") {
    await logError("PUT /api/agent/booking", `Cannot update booking #${current.id} with status "${current.status}"`, body);
    return NextResponse.json(
      { error: "Cannot update a completed or cancelled booking" },
      { status: 409 },
    );
  }

  const newValues = {
    providerId: resolvedProviderId,
    providerBookingRef: provider_booking_ref ?? current.providerBookingRef,
    pickupDatetime: new Date(pickup_datetime),
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
    updatedAt: new Date(),
  };

  const changes: Record<string, { from: unknown; to: unknown }> = {};
  const trackFields: Array<[string, keyof typeof current, unknown]> = [
    ["provider_id", "providerId", newValues.providerId],
    ["pickup_datetime", "pickupDatetime", newValues.pickupDatetime],
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
    current.pickupDatetime > new Date() &&
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

  return NextResponse.json(result[0]);
}

// PATCH — change status by provider_email + provider_booking_ref
export async function PATCH(request: Request) {
  if (!(await verifyAgentRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { provider_email, provider_id, provider_booking_ref, status: newStatus } = body;

  if ((!provider_email && !provider_id) || !provider_booking_ref || !newStatus) {
    return NextResponse.json(
      { error: "Missing required fields: provider_email or provider_id, provider_booking_ref, status" },
      { status: 400 },
    );
  }

  const resolvedProviderId = await resolveProviderId(provider_email, provider_id);
  if (!resolvedProviderId) {
    await logError("PATCH /api/agent/booking", `Provider not found for email "${provider_email}"`, body);
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  const existing = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.providerId, resolvedProviderId), eq(bookings.providerBookingRef, provider_booking_ref)))
    .limit(1);

  if (existing.length === 0) {
    await logError("PATCH /api/agent/booking", `Booking ref "${provider_booking_ref}" not found for provider id ${resolvedProviderId}`, body);
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const current = existing[0];

  const ALLOWED: Record<string, string[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["pending", "completed", "cancelled"],
  };

  if (!(ALLOWED[current.status] ?? []).includes(newStatus)) {
    await logError("PATCH /api/agent/booking", `Invalid status transition "${current.status}" → "${newStatus}" for booking #${current.id}`, body);
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

  return NextResponse.json(result[0]);
}
