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
import { eq, desc } from 'drizzle-orm'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const bookingId = parseInt(id)

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
      driverName: drivers.fullName,
      vehicleId: bookings.vehicleId,
      vehicleName: vehicles.name,
      vehiclePlate: vehicles.plate,
      partnerId: bookings.partnerId,
      partnerName: partners.name,
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
    .leftJoin(drivers, eq(bookings.driverId, drivers.id))
    .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .leftJoin(partners, eq(bookings.partnerId, partners.id))
    .where(eq(bookings.id, bookingId))
    .limit(1)

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Δεν βρέθηκε η κράτηση' }, { status: 404 })
  }

  const history = await db
    .select()
    .from(bookingHistory)
    .where(eq(bookingHistory.bookingId, bookingId))
    .orderBy(desc(bookingHistory.createdAt))

  return NextResponse.json({ ...rows[0], history })
}

export async function PUT(request: Request, context: RouteContext) {
  let session
  try {
    session = await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const bookingId = parseInt(id)

  const existing = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1)

  if (existing.length === 0) {
    return NextResponse.json({ error: 'Δεν βρέθηκε η κράτηση' }, { status: 404 })
  }

  const current = existing[0]
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

  // Lock declared_price if completed
  if (current.status === 'completed' && declared_price !== undefined) {
    return NextResponse.json(
      { error: 'Δεν επιτρέπεται η επεξεργασία της δηλωθείσας τιμής σε ολοκληρωμένη κράτηση' },
      { status: 400 }
    )
  }

  const updateValues: Partial<typeof current> = {}
  const changes: Record<string, { from: unknown; to: unknown }> = {}

  function trackChange<K extends keyof typeof current>(
    key: K,
    newVal: (typeof current)[K] | undefined
  ) {
    if (newVal === undefined) return
    if (String(current[key]) !== String(newVal)) {
      changes[key] = { from: current[key], to: newVal }
    }
    ;(updateValues as Record<string, unknown>)[key] = newVal
  }

  if (provider_booking_ref !== undefined) trackChange('providerBookingRef', provider_booking_ref)
  if (provider_id !== undefined) trackChange('providerId', provider_id)
  if (pickup_datetime !== undefined) trackChange('pickupDatetime', new Date(pickup_datetime))
  if (flight_number !== undefined) trackChange('flightNumber', flight_number ?? null)
  if (pickup_location !== undefined) trackChange('pickupLocation', pickup_location)
  if (dropoff_location !== undefined) trackChange('dropoffLocation', dropoff_location)
  if (passenger_count !== undefined) trackChange('passengerCount', passenger_count)
  if (vehicle_type !== undefined) trackChange('vehicleType', vehicle_type)
  if (baby_seat !== undefined) trackChange('babySeat', baby_seat)
  if (booster_seat !== undefined) trackChange('boosterSeat', booster_seat)
  if (customer_name !== undefined) trackChange('customerName', customer_name)
  if (customer_phone !== undefined) trackChange('customerPhone', customer_phone ?? null)
  if (customer_email !== undefined) trackChange('customerEmail', customer_email ?? null)
  if (payment_method !== undefined) trackChange('paymentMethod', payment_method ?? null)
  if (notes !== undefined) trackChange('notes', notes ?? null)
  if (real_price !== undefined) trackChange('realPrice', real_price != null ? String(real_price) : null)
  if (declared_price !== undefined) trackChange('declaredPrice', declared_price != null ? String(declared_price) : null)
  if (driver_id !== undefined) trackChange('driverId', driver_id ?? null)
  if (vehicle_id !== undefined) trackChange('vehicleId', vehicle_id ?? null)
  if (partner_id !== undefined) trackChange('partnerId', partner_id ?? null)
  if (partner_assignment_price !== undefined)
    trackChange('partnerAssignmentPrice', partner_assignment_price != null ? String(partner_assignment_price) : null)
  if (linked_booking_id !== undefined) trackChange('linkedBookingId', linked_booking_id ?? null)
  if (is_return_trip !== undefined) trackChange('isReturnTrip', is_return_trip)

  const result = await db
    .update(bookings)
    .set({ ...updateValues, updatedAt: new Date() })
    .where(eq(bookings.id, bookingId))
    .returning()

  await db.insert(bookingHistory).values({
    bookingId,
    action: 'updated',
    source: 'manual',
    changedBy: session.user.id,
    changes,
  })

  return NextResponse.json(result[0])
}
