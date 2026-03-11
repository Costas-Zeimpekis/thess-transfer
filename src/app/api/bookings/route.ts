import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  bookings,
  bookingHistory,
  providers,
  drivers,
  vehicles,
  partners,
} from '@/lib/db/schema'
import { eq, and, or, gte, lte, ilike, desc } from 'drizzle-orm'

export async function GET(request: Request) {
  let session
  try {
    session = await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const provider = searchParams.get('provider')
  const driver = searchParams.get('driver')
  const vehicle = searchParams.get('vehicle')
  const partner = searchParams.get('partner')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const search = searchParams.get('search')

  const conditions = []

  if (status) {
    conditions.push(eq(bookings.status, status as 'pending' | 'confirmed' | 'completed' | 'cancelled'))
  }
  if (provider) {
    conditions.push(eq(bookings.providerId, parseInt(provider)))
  }
  if (driver) {
    conditions.push(eq(bookings.driverId, parseInt(driver)))
  }
  if (vehicle) {
    conditions.push(eq(bookings.vehicleId, parseInt(vehicle)))
  }
  if (partner) {
    conditions.push(eq(bookings.partnerId, parseInt(partner)))
  }
  if (from) {
    conditions.push(gte(bookings.pickupDatetime, new Date(from)))
  }
  if (to) {
    conditions.push(lte(bookings.pickupDatetime, new Date(to)))
  }
  if (search) {
    conditions.push(
      or(
        ilike(bookings.customerName, `%${search}%`),
        ilike(bookings.providerBookingRef, `%${search}%`)
      )
    )
  }

  const driversAlias = drivers
  const vehiclesAlias = vehicles
  const partnersAlias = partners

  const rows = await db
    .select({
      id: bookings.id,
      providerBookingRef: bookings.providerBookingRef,
      providerId: bookings.providerId,
      providerName: providers.name,
      status: bookings.status,
      source: bookings.source,
      pickupDatetime: bookings.pickupDatetime,
      flightNumber: bookings.flightNumber,
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
      completedAt: bookings.completedAt,
      createdAt: bookings.createdAt,
      updatedAt: bookings.updatedAt,
    })
    .from(bookings)
    .innerJoin(providers, eq(bookings.providerId, providers.id))
    .leftJoin(driversAlias, eq(bookings.driverId, driversAlias.id))
    .leftJoin(vehiclesAlias, eq(bookings.vehicleId, vehiclesAlias.id))
    .leftJoin(partnersAlias, eq(bookings.partnerId, partnersAlias.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(bookings.pickupDatetime))

  // Compute totals in JS
  let sumReal = 0
  let sumDeclared = 0
  for (const row of rows) {
    if (row.realPrice != null) sumReal += parseFloat(row.realPrice)
    if (row.declaredPrice != null) sumDeclared += parseFloat(row.declaredPrice)
  }

  const totals = {
    realPrice: sumReal.toFixed(2),
    declaredPrice: sumDeclared.toFixed(2),
    difference: (sumReal - sumDeclared).toFixed(2),
  }

  return NextResponse.json({ bookings: rows, totals })
}

export async function POST(request: Request) {
  let session
  try {
    session = await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const {
    provider_booking_ref,
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
    driver_id,
    vehicle_id,
    partner_id,
    partner_assignment_price,
    linked_booking_id,
    is_return_trip,
  } = body

  if (!provider_booking_ref || !provider_id || !pickup_datetime || !pickup_location || !dropoff_location || !vehicle_type || !customer_name) {
    return NextResponse.json({ error: 'Λείπουν υποχρεωτικά πεδία' }, { status: 400 })
  }

  const result = await db
    .insert(bookings)
    .values({
      providerBookingRef: provider_booking_ref,
      providerId: provider_id,
      status: 'pending',
      source: 'manual',
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
      driverId: driver_id ?? null,
      vehicleId: vehicle_id ?? null,
      partnerId: partner_id ?? null,
      partnerAssignmentPrice: partner_assignment_price != null ? String(partner_assignment_price) : null,
      linkedBookingId: linked_booking_id ?? null,
      isReturnTrip: is_return_trip ?? false,
    })
    .returning()

  const booking = result[0]

  await db.insert(bookingHistory).values({
    bookingId: booking.id,
    action: 'created',
    source: 'manual',
    changedBy: session.user.id,
    changes: null,
  })

  return NextResponse.json(booking, { status: 201 })
}
