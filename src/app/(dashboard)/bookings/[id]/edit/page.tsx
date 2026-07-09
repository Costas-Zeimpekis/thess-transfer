import { notFound } from 'next/navigation'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { bookings, providers } from '@/lib/db/schema'
import BookingForm from '@/components/bookings/booking-form'

type PageProps = { params: Promise<{ id: string }> }

export default async function EditBookingPage({ params }: PageProps) {
  const { id } = await params
  const bookingId = parseInt(id)

  if (isNaN(bookingId)) notFound()

  const [booking] = await db
    .select({
      id: bookings.id,
      providerBookingRef: bookings.providerBookingRef,
      providerId: bookings.providerId,
      status: bookings.status,
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
      assignedAt: bookings.assignedAt,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1)

  if (!booking) notFound()

  const allProviders = await db
    .select({ id: providers.id, name: providers.name })
    .from(providers)
    .orderBy(asc(providers.name))

  return (
    <BookingForm
      booking={{
        id: booking.id,
        providerBookingRef: booking.providerBookingRef,
        providerId: booking.providerId,
        status: booking.status,
        arrivalDatetime: booking.arrivalDatetime?.toISOString() ?? '',
        flightNumber: booking.flightNumber,
        startTime: booking.startTime?.toISOString() ?? null,
        endTime: booking.endTime?.toISOString() ?? null,
        pickupLocation: booking.pickupLocation,
        dropoffLocation: booking.dropoffLocation,
        passengerCount: booking.passengerCount,
        vehicleType: booking.vehicleType,
        babySeat: booking.babySeat,
        boosterSeat: booking.boosterSeat,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail,
        paymentMethod: booking.paymentMethod,
        notes: booking.notes,
        realPrice: booking.realPrice,
        declaredPrice: booking.declaredPrice,
        assignedAt: booking.assignedAt?.toISOString() ?? null,
        createdAt: booking.createdAt?.toISOString() ?? null,
      }}
      providers={allProviders}
    />
  )
}
