import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { bookings, bookingHistory, drivers, partners, providers, vehicles } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import BookingDetailClient from '@/components/bookings/booking-detail-client'

type PageProps = { params: Promise<{ id: string }> }

const STATUS_LABELS: Record<string, string> = {
  pending: 'Εκκρεμής',
  confirmed: 'Επιβεβαιωμένη',
  completed: 'Ολοκληρωμένη',
  cancelled: 'Ακυρωμένη',
}

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  car: 'Επιβατικό',
  van: 'Βανάκι',
  bus: 'Λεωφορείο',
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Μετρητά',
  paypal: 'PayPal',
  credit_card: 'Πιστωτική Κάρτα',
  bank: 'Τραπεζική Μεταφορά',
  paid: 'Πληρωμένο',
}

function statusClass(status: string): string {
  switch (status) {
    case 'pending': return 'border-amber-400 text-amber-700 bg-amber-50'
    case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'completed': return 'bg-green-100 text-green-800 border-green-200'
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
    default: return ''
  }
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium">{value ?? '—'}</p>
    </div>
  )
}

export default async function BookingDetailPage({ params }: PageProps) {
  const { id } = await params
  const bookingId = parseInt(id)

  if (isNaN(bookingId)) notFound()

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

  if (rows.length === 0) notFound()

  const booking = rows[0]

  const history = await db
    .select()
    .from(bookingHistory)
    .where(eq(bookingHistory.bookingId, bookingId))
    .orderBy(desc(bookingHistory.createdAt))

  const allProviders = await db.select({ id: providers.id, name: providers.name }).from(providers)

  const realVal = booking.realPrice != null ? parseFloat(booking.realPrice) : null
  const declVal = booking.declaredPrice != null ? parseFloat(booking.declaredPrice) : null
  const diff = realVal != null && declVal != null ? realVal - declVal : null

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/bookings"
            className="inline-flex h-7 items-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted transition-colors"
          >
            ← Πίσω
          </Link>
          <h1 className="text-2xl font-semibold">Κράτηση #{booking.id}</h1>
          <Badge variant="outline" className={statusClass(booking.status)}>
            {STATUS_LABELS[booking.status] ?? booking.status}
          </Badge>
        </div>
        <BookingDetailClient
          booking={{
            id: booking.id,
            providerBookingRef: booking.providerBookingRef,
            providerId: booking.providerId,
            status: booking.status,
            pickupDatetime: booking.pickupDatetime?.toISOString(),
            flightNumber: booking.flightNumber,
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
          }}
          providers={allProviders}
        />
      </div>

      {/* Booking details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Στοιχεία Κράτησης</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Ref Παρόχου" value={booking.providerBookingRef} />
          <Field label="Πάροχος" value={booking.providerName} />
          <Field label="Πηγή" value={booking.source === 'manual' ? 'Χειροκίνητη' : 'Αυτόματη'} />
          <Field
            label="Ημερομηνία & Ώρα Παραλαβής"
            value={booking.pickupDatetime
              ? new Date(booking.pickupDatetime).toLocaleString('el-GR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })
              : null}
          />
          <Field label="Αρ. Πτήσης" value={booking.flightNumber} />
          <Field label="Αρ. Επιβατών" value={booking.passengerCount} />
          <Field label="Τόπος Παραλαβής" value={booking.pickupLocation} />
          <Field label="Τόπος Αποστολής" value={booking.dropoffLocation} />
          <Field label="Τύπος Οχήματος" value={VEHICLE_TYPE_LABELS[booking.vehicleType] ?? booking.vehicleType} />
          <Field label="Baby Seat" value={booking.babySeat ? 'Ναι' : 'Όχι'} />
          <Field label="Booster Seat" value={booking.boosterSeat ? 'Ναι' : 'Όχι'} />
        </CardContent>
      </Card>

      {/* Customer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Στοιχεία Πελάτη</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Ονοματεπώνυμο" value={booking.customerName} />
          <Field label="Τηλέφωνο" value={booking.customerPhone} />
          <Field label="Email" value={booking.customerEmail} />
        </CardContent>
      </Card>

      {/* Financials */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Οικονομικά</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field
            label="Τρόπος Πληρωμής"
            value={booking.paymentMethod ? PAYMENT_LABELS[booking.paymentMethod] ?? booking.paymentMethod : null}
          />
          <Field
            label="Πραγματική Τιμή"
            value={realVal != null ? `€${realVal.toFixed(2)}` : null}
          />
          <Field
            label="Δηλωθείσα Τιμή"
            value={declVal != null ? `€${declVal.toFixed(2)}` : null}
          />
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Διαφορά</p>
            <p className={`text-sm font-medium ${diff != null && diff < 0 ? 'text-red-600' : ''}`}>
              {diff != null ? `€${diff.toFixed(2)}` : '—'}
            </p>
          </div>
        </CardContent>
        {booking.notes && (
          <>
            <Separator />
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-0.5">Σημειώσεις</p>
              <p className="text-sm whitespace-pre-wrap">{booking.notes}</p>
            </CardContent>
          </>
        )}
      </Card>

      {/* Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ανάθεση</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {booking.driverName ? (
            <>
              <Field label="Οδηγός" value={booking.driverName} />
              <Field
                label="Όχημα"
                value={booking.vehicleName ? `${booking.vehicleName} (${booking.vehiclePlate})` : null}
              />
            </>
          ) : booking.partnerName ? (
            <>
              <Field label="Συνεργάτης" value={booking.partnerName} />
              <Field
                label="Τιμή Ανάθεσης"
                value={booking.partnerAssignmentPrice
                  ? `€${parseFloat(booking.partnerAssignmentPrice).toFixed(2)}`
                  : null}
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground col-span-3">Δεν έχει γίνει ανάθεση</p>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ιστορικό</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Δεν υπάρχουν εγγραφές ιστορικού</p>
          ) : (
            <ol className="space-y-3">
              {history.map((h) => (
                <li key={h.id} className="flex gap-3 text-sm">
                  <span className="text-muted-foreground whitespace-nowrap">
                    {h.createdAt
                      ? new Date(h.createdAt).toLocaleString('el-GR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })
                      : '—'}
                  </span>
                  <span className="font-medium">{h.action}</span>
                  {h.changes != null && (
                    <span className="text-muted-foreground text-xs font-mono truncate">
                      {JSON.stringify(h.changes)}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
