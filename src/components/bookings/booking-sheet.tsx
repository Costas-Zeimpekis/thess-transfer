'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'

type Provider = { id: number; name: string }

export type BookingFormData = {
  id?: number
  providerBookingRef: string
  providerId: number
  status?: string
  pickupDatetime: string
  flightNumber: string | null
  pickupLocation: string
  dropoffLocation: string
  passengerCount: number
  vehicleType: string
  babySeat: boolean | null
  boosterSeat: boolean | null
  customerName: string
  customerPhone: string | null
  customerEmail: string | null
  paymentMethod: string | null
  notes: string | null
  realPrice: string | null
  declaredPrice: string | null
}

type BookingSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking?: BookingFormData | null
  providers: Provider[]
  onSuccess: () => void
}

const EMPTY_FORM = {
  providerBookingRef: '',
  providerId: '',
  pickupDatetime: '',
  flightNumber: '',
  pickupLocation: '',
  dropoffLocation: '',
  passengerCount: '1',
  vehicleType: 'car',
  babySeat: false,
  boosterSeat: false,
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  paymentMethod: 'none',
  notes: '',
  realPrice: '',
  declaredPrice: '',
}

export default function BookingSheet({
  open,
  onOpenChange,
  booking,
  providers,
  onSuccess,
}: BookingSheetProps) {
  const isEdit = !!booking

  const [providerBookingRef, setProviderBookingRef] = useState('')
  const [providerId, setProviderId] = useState('')
  const [pickupDatetime, setPickupDatetime] = useState('')
  const [flightNumber, setFlightNumber] = useState('')
  const [pickupLocation, setPickupLocation] = useState('')
  const [dropoffLocation, setDropoffLocation] = useState('')
  const [passengerCount, setPassengerCount] = useState('1')
  const [vehicleType, setVehicleType] = useState('car')
  const [babySeat, setBabySeat] = useState(false)
  const [boosterSeat, setBoosterSeat] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('none')
  const [notes, setNotes] = useState('')
  const [realPrice, setRealPrice] = useState('')
  const [declaredPrice, setDeclaredPrice] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (booking) {
      setProviderBookingRef(booking.providerBookingRef)
      setProviderId(String(booking.providerId))
      setPickupDatetime(new Date(booking.pickupDatetime).toISOString().slice(0, 16))
      setFlightNumber(booking.flightNumber ?? '')
      setPickupLocation(booking.pickupLocation)
      setDropoffLocation(booking.dropoffLocation)
      setPassengerCount(String(booking.passengerCount))
      setVehicleType(booking.vehicleType)
      setBabySeat(booking.babySeat ?? false)
      setBoosterSeat(booking.boosterSeat ?? false)
      setCustomerName(booking.customerName)
      setCustomerPhone(booking.customerPhone ?? '')
      setCustomerEmail(booking.customerEmail ?? '')
      setPaymentMethod(booking.paymentMethod ?? 'none')
      setNotes(booking.notes ?? '')
      setRealPrice(booking.realPrice ?? '')
      setDeclaredPrice(booking.declaredPrice ?? '')
    } else {
      setProviderBookingRef(EMPTY_FORM.providerBookingRef)
      setProviderId(EMPTY_FORM.providerId)
      setPickupDatetime(EMPTY_FORM.pickupDatetime)
      setFlightNumber(EMPTY_FORM.flightNumber)
      setPickupLocation(EMPTY_FORM.pickupLocation)
      setDropoffLocation(EMPTY_FORM.dropoffLocation)
      setPassengerCount(EMPTY_FORM.passengerCount)
      setVehicleType(EMPTY_FORM.vehicleType)
      setBabySeat(EMPTY_FORM.babySeat)
      setBoosterSeat(EMPTY_FORM.boosterSeat)
      setCustomerName(EMPTY_FORM.customerName)
      setCustomerPhone(EMPTY_FORM.customerPhone)
      setCustomerEmail(EMPTY_FORM.customerEmail)
      setPaymentMethod(EMPTY_FORM.paymentMethod)
      setNotes(EMPTY_FORM.notes)
      setRealPrice(EMPTY_FORM.realPrice)
      setDeclaredPrice(EMPTY_FORM.declaredPrice)
    }
    setError('')
  }, [open, booking])

  const declaredPriceLocked = isEdit && booking?.status === 'completed'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const url = isEdit && booking ? `/api/bookings/${booking.id}` : '/api/bookings'
      const method = isEdit ? 'PUT' : 'POST'

      const body: Record<string, unknown> = {
        provider_booking_ref: providerBookingRef,
        provider_id: parseInt(providerId, 10),
        pickup_datetime: pickupDatetime,
        flight_number: flightNumber || null,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        passenger_count: parseInt(passengerCount, 10),
        vehicle_type: vehicleType,
        baby_seat: babySeat,
        booster_seat: boosterSeat,
        customer_name: customerName,
        customer_phone: customerPhone || null,
        customer_email: customerEmail || null,
        payment_method: paymentMethod === 'none' ? null : paymentMethod,
        notes: notes || null,
        real_price: realPrice ? parseFloat(realPrice) : null,
      }

      if (!declaredPriceLocked) {
        body.declared_price = declaredPrice ? parseFloat(declaredPrice) : null
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Σφάλμα. Δοκιμάστε ξανά.')
        return
      }

      onSuccess()
      onOpenChange(false)
    } catch {
      setError('Σφάλμα. Δοκιμάστε ξανά.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Επεξεργασία Κράτησης' : 'Νέα Κράτηση'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
          {/* Στοιχεία Κράτησης */}
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Στοιχεία Κράτησης
          </p>

          <div className="space-y-2">
            <Label htmlFor="providerBookingRef">Ref Παρόχου *</Label>
            <Input
              id="providerBookingRef"
              value={providerBookingRef}
              onChange={(e) => setProviderBookingRef(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Πάροχος *</Label>
            <Select value={providerId} onValueChange={(v) => setProviderId(v ?? '')} required disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Επιλογή παρόχου" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickupDatetime">Ημερομηνία & Ώρα Παραλαβής *</Label>
            <Input
              id="pickupDatetime"
              type="datetime-local"
              value={pickupDatetime}
              onChange={(e) => setPickupDatetime(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="flightNumber">Αρ. Πτήσης</Label>
            <Input
              id="flightNumber"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickupLocation">Τόπος Παραλαβής *</Label>
            <Input
              id="pickupLocation"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dropoffLocation">Τόπος Αποστολής *</Label>
            <Input
              id="dropoffLocation"
              value={dropoffLocation}
              onChange={(e) => setDropoffLocation(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="passengerCount">Αρ. Επιβατών *</Label>
            <Input
              id="passengerCount"
              type="number"
              min={1}
              value={passengerCount}
              onChange={(e) => setPassengerCount(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Τύπος Οχήματος *</Label>
            <Select value={vehicleType} onValueChange={(v) => setVehicleType(v ?? 'car')} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="car">Επιβατικό</SelectItem>
                <SelectItem value="van">Βανάκι</SelectItem>
                <SelectItem value="bus">Λεωφορείο</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <input
                id="babySeat"
                type="checkbox"
                checked={babySeat}
                onChange={(e) => setBabySeat(e.target.checked)}
                disabled={loading}
                className="h-4 w-4"
              />
              <Label htmlFor="babySeat">Baby Seat</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="boosterSeat"
                type="checkbox"
                checked={boosterSeat}
                onChange={(e) => setBoosterSeat(e.target.checked)}
                disabled={loading}
                className="h-4 w-4"
              />
              <Label htmlFor="boosterSeat">Booster Seat</Label>
            </div>
          </div>

          <Separator />

          {/* Στοιχεία Πελάτη */}
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Στοιχεία Πελάτη
          </p>

          <div className="space-y-2">
            <Label htmlFor="customerName">Ονοματεπώνυμο *</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone">Τηλέφωνο</Label>
            <Input
              id="customerPhone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerEmail">Email</Label>
            <Input
              id="customerEmail"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <Separator />

          {/* Οικονομικά */}
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Οικονομικά
          </p>

          <div className="space-y-2">
            <Label>Τρόπος Πληρωμής</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v ?? 'none')} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="cash">Μετρητά</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="credit_card">Πιστωτική Κάρτα</SelectItem>
                <SelectItem value="bank">Τραπεζική Μεταφορά</SelectItem>
                <SelectItem value="paid">Πληρωμένο</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="realPrice">Πραγματική Τιμή</Label>
            <Input
              id="realPrice"
              type="number"
              step="0.01"
              min="0"
              value={realPrice}
              onChange={(e) => setRealPrice(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="declaredPrice">Δηλωθείσα Τιμή</Label>
            <Input
              id="declaredPrice"
              type="number"
              step="0.01"
              min="0"
              value={declaredPrice}
              onChange={(e) => setDeclaredPrice(e.target.value)}
              disabled={loading || declaredPriceLocked}
            />
            {declaredPriceLocked && (
              <p className="text-xs text-muted-foreground">
                Κλειδωμένο — η κράτηση είναι ολοκληρωμένη
              </p>
            )}
          </div>

          <Separator />

          {/* Σημειώσεις */}
          <div className="space-y-2">
            <Label htmlFor="notes">Σημειώσεις</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <SheetFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Ακύρωση
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Αποθήκευση…' : 'Αποθήκευση'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
