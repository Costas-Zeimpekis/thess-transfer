import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { verifyAgentRequest } from "@/lib/agent-auth";
import { db } from "@/lib/db";
import { bookingHistory, bookings, providerEmails } from "@/lib/db/schema";

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
    declared_price,
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
  const resolvedRef = provider_booking_ref ?? `AGENT-${Date.now()}`;

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
      declaredPrice: declared_price != null ? String(declared_price) : null,
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

// PUT — update booking fields by id
export async function PUT(request: Request) {
  if (!(await verifyAgentRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...fields } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const current = existing[0];

  if (current.status === "completed" || current.status === "cancelled") {
    return NextResponse.json(
      { error: "Cannot update a completed or cancelled booking" },
      { status: 409 },
    );
  }

  const {
    provider_email,
    provider_id,
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
    declared_price,
    is_return_trip,
  } = fields;

  const updateValues: Record<string, unknown> = { updatedAt: new Date() };
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  function track(key: string, dbKey: keyof typeof current, newVal: unknown) {
    if (newVal === undefined) return;
    if (String(current[dbKey]) !== String(newVal)) {
      changes[key] = { from: current[dbKey], to: newVal };
    }
    updateValues[dbKey] = newVal;
  }

  if (provider_email !== undefined || provider_id !== undefined) {
    const resolved = await resolveProviderId(provider_email, provider_id);
    track("provider_id", "providerId", resolved);
  }
  track("pickup_datetime", "pickupDatetime", pickup_datetime ? new Date(pickup_datetime) : undefined);
  track("flight_number", "flightNumber", flight_number ?? null);
  track("pickup_location", "pickupLocation", pickup_location);
  track("dropoff_location", "dropoffLocation", dropoff_location);
  track("passenger_count", "passengerCount", passenger_count);
  track("vehicle_type", "vehicleType", vehicle_type);
  track("baby_seat", "babySeat", baby_seat);
  track("booster_seat", "boosterSeat", booster_seat);
  track("customer_name", "customerName", customer_name);
  track("customer_phone", "customerPhone", customer_phone ?? null);
  track("customer_email", "customerEmail", customer_email ?? null);
  track("payment_method", "paymentMethod", payment_method ?? null);
  track("notes", "notes", notes ?? null);
  track("real_price", "realPrice", real_price != null ? String(real_price) : null);
  track("declared_price", "declaredPrice", declared_price != null ? String(declared_price) : null);
  track("is_return_trip", "isReturnTrip", is_return_trip);

  // Revert confirmed to pending if pickup is in the future (matches intake API behaviour)
  if (
    current.status === "confirmed" &&
    current.pickupDatetime > new Date() &&
    Object.keys(changes).length > 0
  ) {
    updateValues.status = "pending";
    updateValues.driverId = null;
    updateValues.vehicleId = null;
    updateValues.partnerId = null;
    updateValues.partnerAssignmentPrice = null;
    changes.status = { from: current.status, to: "pending" };
  }

  const result = await db
    .update(bookings)
    .set(updateValues)
    .where(eq(bookings.id, id))
    .returning();

  await db.insert(bookingHistory).values({
    bookingId: id,
    action: "updated",
    source: "automatic",
    changedBy: null,
    changes,
  });

  return NextResponse.json(result[0]);
}

// PATCH — change status by id
export async function PATCH(request: Request) {
  if (!(await verifyAgentRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, status: newStatus } = body;

  if (!id || !newStatus) {
    return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, id)))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const current = existing[0];

  const ALLOWED: Record<string, string[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["pending", "completed", "cancelled"],
  };

  if (!(ALLOWED[current.status] ?? []).includes(newStatus)) {
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
    .where(eq(bookings.id, id))
    .returning();

  await db.insert(bookingHistory).values({
    bookingId: id,
    action: `status_changed_to_${newStatus}`,
    source: "automatic",
    changedBy: null,
    changes: { status: { from: current.status, to: newStatus } },
  });

  return NextResponse.json(result[0]);
}
