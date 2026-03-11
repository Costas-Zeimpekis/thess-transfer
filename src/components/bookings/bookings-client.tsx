'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import BookingSheet from './booking-sheet'

type Provider = { id: number; name: string; slug: string }
type Driver = { id: number; fullName: string }
type Vehicle = { id: number; name: string; plate: string }
type Partner = { id: number; name: string }

export type BookingRow = {
  id: number
  providerBookingRef: string
  providerId: number
  providerName: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  source: string
  pickupDatetime: string
  flightNumber: string | null
  pickupLocation: string
  dropoffLocation: string
  passengerCount: number
  vehicleType: 'car' | 'van' | 'bus'
  babySeat: boolean | null
  boosterSeat: boolean | null
  customerName: string
  customerPhone: string | null
  customerEmail: string | null
  paymentMethod: string | null
  notes: string | null
  realPrice: string | null
  declaredPrice: string | null
  driverId: number | null
  driverName: string | null
  vehicleId: number | null
  vehicleName: string | null
  vehiclePlate: string | null
  partnerId: number | null
  partnerName: string | null
  partnerAssignmentPrice: string | null
  linkedBookingId: number | null
  isReturnTrip: boolean | null
  createdAt: string
  updatedAt: string
}

type Totals = {
  realPrice: string
  declaredPrice: string
  difference: string
}

type BookingsClientProps = {
  providers: Provider[]
  drivers: Driver[]
  vehicles: Vehicle[]
  partners: Partner[]
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Εκκρεμείς',
  confirmed: 'Επιβεβαιωμένες',
  completed: 'Ολοκληρωμένες',
  cancelled: 'Ακυρωμένες',
}

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  car: 'Επιβατικό',
  van: 'Βανάκι',
  bus: 'Λεωφορείο',
}

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'confirmed': return 'default'
    case 'completed': return 'default'
    case 'cancelled': return 'destructive'
    default: return 'outline'
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'pending': return 'border-amber-400 text-amber-700 bg-amber-50'
    case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'completed': return 'bg-green-100 text-green-800 border-green-200'
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
    default: return ''
  }
}

function fmt(val: string | null): string {
  if (val == null) return '—'
  return `€${parseFloat(val).toFixed(2)}`
}

function diffClass(val: number): string {
  return val < 0 ? 'text-red-600 font-medium' : ''
}

export default function BookingsClient({ providers, drivers, vehicles, partners }: BookingsClientProps) {
  const router = useRouter()

  // Filter state
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [status, setStatus] = useState('all')
  const [providerId, setProviderId] = useState('all')
  const [driverId, setDriverId] = useState('all')
  const [vehicleId, setVehicleId] = useState('all')
  const [partnerId, setPartnerId] = useState('all')
  const [search, setSearch] = useState('')

  // Applied filters (set on button click)
  const [applied, setApplied] = useState({
    from: '',
    to: '',
    status: 'all',
    providerId: 'all',
    driverId: 'all',
    vehicleId: 'all',
    partnerId: 'all',
    search: '',
  })

  // Data state
  const [bookingsList, setBookingsList] = useState<BookingRow[]>([])
  const [totals, setTotals] = useState<Totals>({ realPrice: '0.00', declaredPrice: '0.00', difference: '0.00' })
  const [loading, setLoading] = useState(false)

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<BookingRow | null>(null)

  const fetchBookings = useCallback(async (filters: typeof applied) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.status !== 'all') params.set('status', filters.status)
      if (filters.providerId !== 'all') params.set('provider', filters.providerId)
      if (filters.driverId !== 'all') params.set('driver', filters.driverId)
      if (filters.vehicleId !== 'all') params.set('vehicle', filters.vehicleId)
      if (filters.partnerId !== 'all') params.set('partner', filters.partnerId)
      if (filters.from) params.set('from', filters.from)
      if (filters.to) params.set('to', filters.to)
      if (filters.search) params.set('search', filters.search)

      const res = await fetch(`/api/bookings?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setBookingsList(data.bookings)
        setTotals(data.totals)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchBookings(applied)
  }, [applied, fetchBookings])

  function handleApply() {
    setApplied({ from, to, status, providerId, driverId, vehicleId, partnerId, search })
  }

  function handleReset() {
    setFrom('')
    setTo('')
    setStatus('all')
    setProviderId('all')
    setDriverId('all')
    setVehicleId('all')
    setPartnerId('all')
    setSearch('')
    setApplied({ from: '', to: '', status: 'all', providerId: 'all', driverId: 'all', vehicleId: 'all', partnerId: 'all', search: '' })
  }

  function handleCreate() {
    setEditingBooking(null)
    setSheetOpen(true)
  }

  function handleSuccess() {
    router.refresh()
    void fetchBookings(applied)
  }

  const totalDiff = parseFloat(totals.difference)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Κρατήσεις</h1>
        <Button onClick={handleCreate}>Νέα Κράτηση</Button>
      </div>

      {/* Filter bar */}
      <div className="rounded-md border p-4 mb-4 space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="from">Από</Label>
            <Input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to">Έως</Label>
            <Input
              id="to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Κατάσταση</Label>
            <Select value={status} onValueChange={(v) => setStatus(v ?? 'all')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Όλες</SelectItem>
                <SelectItem value="pending">Εκκρεμείς</SelectItem>
                <SelectItem value="confirmed">Επιβεβαιωμένες</SelectItem>
                <SelectItem value="completed">Ολοκληρωμένες</SelectItem>
                <SelectItem value="cancelled">Ακυρωμένες</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Πάροχος</Label>
            <Select value={providerId} onValueChange={(v) => setProviderId(v ?? 'all')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Όλοι</SelectItem>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label>Οδηγός</Label>
            <Select value={driverId} onValueChange={(v) => setDriverId(v ?? 'all')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Όλοι</SelectItem>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>{d.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Όχημα</Label>
            <Select value={vehicleId} onValueChange={(v) => setVehicleId(v ?? 'all')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Όλα</SelectItem>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>{v.name} ({v.plate})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Συνεργάτης</Label>
            <Select value={partnerId} onValueChange={(v) => setPartnerId(v ?? 'all')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Όλοι</SelectItem>
                {partners.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="search">Αναζήτηση</Label>
            <Input
              id="search"
              placeholder="Όνομα πελάτη ή ref…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleApply() }}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleApply} disabled={loading}>Εφαρμογή</Button>
          <Button variant="outline" onClick={handleReset} disabled={loading}>Καθαρισμός</Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Ref Παρόχου</TableHead>
              <TableHead>Πάροχος</TableHead>
              <TableHead>Ημ/νία Παραλαβής</TableHead>
              <TableHead>Διαδρομή</TableHead>
              <TableHead>Πελάτης</TableHead>
              <TableHead>Τύπος Οχήματος</TableHead>
              <TableHead>Ανάθεση</TableHead>
              <TableHead>Κατάσταση</TableHead>
              <TableHead className="text-right">Πραγματική</TableHead>
              <TableHead className="text-right">Δηλωθείσα</TableHead>
              <TableHead className="text-right">Διαφορά</TableHead>
              <TableHead className="text-right">Ενέργειες</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={13} className="text-center text-muted-foreground py-8">
                  Φόρτωση…
                </TableCell>
              </TableRow>
            )}
            {!loading && bookingsList.length === 0 && (
              <TableRow>
                <TableCell colSpan={13} className="text-center text-muted-foreground py-8">
                  Δεν βρέθηκαν κρατήσεις
                </TableCell>
              </TableRow>
            )}
            {!loading && bookingsList.map((b) => {
              const realVal = b.realPrice != null ? parseFloat(b.realPrice) : null
              const declVal = b.declaredPrice != null ? parseFloat(b.declaredPrice) : null
              const diff = realVal != null && declVal != null ? realVal - declVal : null

              const assignment = b.driverName
                ? `${b.driverName}${b.vehiclePlate ? ` / ${b.vehiclePlate}` : ''}`
                : b.partnerName ?? '—'

              const route = `${b.pickupLocation} → ${b.dropoffLocation}`
              const routeTruncated = route.length > 40 ? route.slice(0, 40) + '…' : route

              return (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-sm">{b.id}</TableCell>
                  <TableCell className="font-mono text-sm">{b.providerBookingRef}</TableCell>
                  <TableCell>{b.providerName}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {new Date(b.pickupDatetime).toLocaleString('el-GR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell title={route} className="max-w-[200px] truncate text-sm">
                    {routeTruncated}
                  </TableCell>
                  <TableCell>{b.customerName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {VEHICLE_TYPE_LABELS[b.vehicleType] ?? b.vehicleType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{assignment}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusBadgeClass(b.status)}>
                      {STATUS_LABELS[b.status] ?? b.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(b.realPrice)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(b.declaredPrice)}</TableCell>
                  <TableCell className={`text-right font-mono text-sm ${diff != null ? diffClass(diff) : ''}`}>
                    {diff != null ? `€${diff.toFixed(2)}` : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/bookings/${b.id}`}
                      title="Προβολή"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Footer totals */}
      <div className="mt-4 flex flex-wrap gap-6 rounded-md border bg-muted/40 px-4 py-3 text-sm">
        <span>
          <span className="text-muted-foreground">Σύνολο Πραγματικής Τιμής: </span>
          <span className="font-semibold font-mono">€{parseFloat(totals.realPrice).toFixed(2)}</span>
        </span>
        <span>
          <span className="text-muted-foreground">Σύνολο Δηλωθείσας Τιμής: </span>
          <span className="font-semibold font-mono">€{parseFloat(totals.declaredPrice).toFixed(2)}</span>
        </span>
        <span>
          <span className="text-muted-foreground">Σύνολο Διαφοράς: </span>
          <span className={`font-semibold font-mono ${totalDiff < 0 ? 'text-red-600' : ''}`}>
            €{totalDiff.toFixed(2)}
          </span>
        </span>
      </div>

      <BookingSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        booking={editingBooking}
        providers={providers}
        onSuccess={handleSuccess}
      />
    </>
  )
}
