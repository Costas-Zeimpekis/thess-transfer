import { and, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseAthensDatetime } from "@/lib/utils";
import {
  bookingHistory,
  bookings,
  drivers,
  partners,
  providers,
  vehicles,
} from "@/lib/db/schema";

export async function GET(request: Request) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const sourceFilter = searchParams.get("source");
  const provider = searchParams.get("provider");
  const driver = searchParams.get("driver");
  const vehicle = searchParams.get("vehicle");
  const partner = searchParams.get("partner");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const search = searchParams.get("search");
  const paymentMethod = searchParams.get("paymentMethod");
  const pickupLocation = searchParams.get("pickupLocation");
  const dropoffLocation = searchParams.get("dropoffLocation");
  const vehicleType = searchParams.get("vehicleType");

  const conditions = [];

  // Admins only see approved bookings; developers see all
  if (session.user.role === "admin") {
    conditions.push(eq(bookings.approved, true));
  }

  if (status) {
    conditions.push(
      eq(
        bookings.status,
        status as "pending" | "confirmed" | "completed" | "cancelled",
      ),
    );
  }
  if (sourceFilter === "automatic" || sourceFilter === "manual") {
    conditions.push(eq(bookings.source, sourceFilter));
  }
  if (provider) {
    conditions.push(eq(bookings.providerId, parseInt(provider)));
  }
  if (driver) {
    conditions.push(eq(bookings.driverId, parseInt(driver)));
  }
  if (vehicle) {
    conditions.push(eq(bookings.vehicleId, parseInt(vehicle)));
  }
  if (partner) {
    conditions.push(eq(bookings.partnerId, parseInt(partner)));
  }
  if (from) {
    conditions.push(gte(bookings.arrivalDatetime, new Date(from)));
  }
  if (to) {
    const toDate = new Date(to);
    toDate.setUTCHours(23, 59, 59, 999);
    conditions.push(lte(bookings.arrivalDatetime, toDate));
  }
  if (search) {
    conditions.push(
      or(
        ilike(bookings.customerName, `%${search}%`),
        ilike(bookings.providerBookingRef, `%${search}%`),
      ),
    );
  }
  if (paymentMethod) {
    conditions.push(
      eq(
        bookings.paymentMethod,
        paymentMethod as "cash" | "paypal" | "credit_card" | "bank" | "paid",
      ),
    );
  }
  if (pickupLocation) {
    conditions.push(ilike(bookings.pickupLocation, `%${pickupLocation}%`));
  }
  if (dropoffLocation) {
    conditions.push(ilike(bookings.dropoffLocation, `%${dropoffLocation}%`));
  }
  if (vehicleType) {
    conditions.push(
      eq(bookings.vehicleType, vehicleType as "car" | "van" | "bus"),
    );
  }

  const driversAlias = drivers;
  const vehiclesAlias = vehicles;
  const partnersAlias = partners;

  const rows = await db
    .select({
      id: bookings.id,
      providerBookingRef: bookings.providerBookingRef,
      providerId: bookings.providerId,
      providerName: providers.name,
      status: bookings.status,
      source: bookings.source,
      arrivalDatetime: bookings.arrivalDatetime,
      flightNumber: bookings.flightNumber,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      pickupLocation: bookings.pickupLocation,
      dropoffLocation: bookings.dropoffLocation,
      passengerCount: bookings.passengerCount,
      vehicleType: bookings.vehicleType,
      babySeat: bookings.babySeat,
      boosterSeat: bookings.boosterSeat,
      customerName: bookings.customerName,
      customerPhone: bookings.customerPhone,
      customerEmail: bookings.customerEmail,
      paymentMethod: bookings.paymentMethod,
      notes: bookings.notes,
      realPrice: bookings.realPrice,
      declaredPrice: bookings.declaredPrice,
      driverId: bookings.driverId,
      driverName: driversAlias.fullName,
      vehicleId: bookings.vehicleId,
      vehicleName: vehiclesAlias.name,
      vehiclePlate: vehiclesAlias.plate,
      partnerId: bookings.partnerId,
      partnerName: partnersAlias.name,
      partnerAssignmentPrice: bookings.partnerAssignmentPrice,
      linkedBookingId: bookings.linkedBookingId,
      isReturnTrip: bookings.isReturnTrip,
      customFields: bookings.customFields,
      approved: bookings.approved,
      completedAt: bookings.completedAt,
      createdAt: bookings.createdAt,
      updatedAt: bookings.updatedAt,
    })
    .from(bookings)
    .leftJoin(providers, eq(bookings.providerId, providers.id))
    .leftJoin(driversAlias, eq(bookings.driverId, driversAlias.id))
    .leftJoin(vehiclesAlias, eq(bookings.vehicleId, vehiclesAlias.id))
    .leftJoin(partnersAlias, eq(bookings.partnerId, partnersAlias.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(bookings.arrivalDatetime));

  // Compute totals in JS
  let sumReal = 0;
  let sumDeclared = 0;
  for (const row of rows) {
    if (row.realPrice != null) sumReal += parseFloat(row.realPrice);
    if (row.declaredPrice != null) sumDeclared += parseFloat(row.declaredPrice);
  }

  const totals = {
    realPrice: sumReal.toFixed(2),
    declaredPrice: sumDeclared.toFixed(2),
    difference: (sumReal - sumDeclared).toFixed(2),
  };

  return NextResponse.json({ bookings: rows, totals });
}

export async function POST(request: Request) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const {
    source,
    provider_booking_ref,
    provider_id,
    pickup_datetime,
    flight_number,
    start_time,
    end_time,
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
    driver_id,
    vehicle_id,
    partner_id,
    partner_assignment_price,
    linked_booking_id,
    is_return_trip,
  } = body;

  const bookingSource: "automatic" | "manual" =
    source === "automatic" ? "automatic" : "manual";
  const isProviderBooking = bookingSource === "automatic";

  // Validation: provider bookings need provider + ref; own bookings need neither
  if (
    !pickup_datetime ||
    !pickup_location ||
    !dropoff_location ||
    !vehicle_type ||
    !customer_name
  ) {
    return NextResponse.json(
      { error: "Λείπουν υποχρεωτικά πεδία" },
      { status: 400 },
    );
  }
  if (isProviderBooking && (!provider_booking_ref || !provider_id)) {
    return NextResponse.json(
      { error: "Λείπουν υποχρεωτικά πεδία παρόχου" },
      { status: 400 },
    );
  }

  if (provider_id && provider_booking_ref) {
    const duplicate = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.providerId, provider_id),
          eq(bookings.providerBookingRef, provider_booking_ref),
        ),
      )
      .limit(1);
    if (duplicate.length > 0) {
      return NextResponse.json(
        { error: "Το Ref Παρόχου υπάρχει ήδη για αυτόν τον πάροχο" },
        { status: 409 },
      );
    }
  }

  // Auto-generate ref for own bookings (updated to MAN-{id} after insert)
  const resolvedRef = isProviderBooking
    ? provider_booking_ref
    : `OWN-${Date.now()}`;

  const result = await db
    .insert(bookings)
    .values({
      providerBookingRef: resolvedRef,
      providerId: isProviderBooking ? provider_id : null,
      status: "pending",
      source: bookingSource,
      arrivalDatetime: parseAthensDatetime(pickup_datetime),
      flightNumber: flight_number ?? null,
      startTime: start_time ? parseAthensDatetime(start_time) : null,
      endTime: end_time ? parseAthensDatetime(end_time) : null,
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
      declaredPrice: declared_price != null ? String(declared_price) : null,
      driverId: driver_id ?? null,
      vehicleId: vehicle_id ?? null,
      partnerId: partner_id ?? null,
      partnerAssignmentPrice:
        partner_assignment_price != null
          ? String(partner_assignment_price)
          : null,
      linkedBookingId: linked_booking_id ?? null,
      isReturnTrip: is_return_trip ?? false,
      approved: true, // manual bookings are always visible
    })
    .returning();

  let booking = result[0];

  if (!isProviderBooking) {
    const updated = await db
      .update(bookings)
      .set({ providerBookingRef: `MAN-${booking.id}` })
      .where(eq(bookings.id, booking.id))
      .returning();
    booking = updated[0];
  }

  await db.insert(bookingHistory).values({
    bookingId: booking.id,
    action: "created",
    source: "manual",
    changedBy: session.user.id,
    changes: null,
  });

  return NextResponse.json(booking, { status: 201 });
}
