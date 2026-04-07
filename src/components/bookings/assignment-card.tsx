'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Driver = { id: number; fullName: string }
type Vehicle = { id: number; name: string; plate: string }
type Partner = { id: number; name: string }

type AssignmentCardProps = {
  bookingId: number
  bookingStatus: string
  initialDriverId: number | null
  initialVehicleId: number | null
  initialPartnerId: number | null
  initialPartnerPrice: string | null
  drivers: Driver[]
  vehicles: Vehicle[]
  partners: Partner[]
}

export default function AssignmentCard({
  bookingId,
  bookingStatus,
  initialDriverId,
  initialVehicleId,
  initialPartnerId,
  initialPartnerPrice,
  drivers,
  vehicles,
  partners,
}: AssignmentCardProps) {
  const router = useRouter()
  const isLocked = bookingStatus === 'completed' || bookingStatus === 'cancelled'
  const hasAssignment = initialDriverId != null || initialPartnerId != null

  const [mode, setMode] = useState<'driver' | 'partner'>(
    initialPartnerId != null ? 'partner' : 'driver',
  )
  const [driverId, setDriverId] = useState(initialDriverId ? String(initialDriverId) : '')
  const [vehicleId, setVehicleId] = useState(initialVehicleId ? String(initialVehicleId) : '')
  const [partnerId, setPartnerId] = useState(initialPartnerId ? String(initialPartnerId) : '')
  const [partnerPrice, setPartnerPrice] = useState(initialPartnerPrice ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function post(body: object) {
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Σφάλμα. Δοκιμάστε ξανά.')
        return
      }
      router.refresh()
    } catch {
      setError('Σφάλμα. Δοκιμάστε ξανά.')
    } finally {
      setLoading(false)
    }
  }

  function handleAssign() {
    if (mode === 'driver') {
      post({ type: 'driver', driverId: parseInt(driverId, 10), vehicleId: parseInt(vehicleId, 10) })
    } else {
      post({ type: 'partner', partnerId: parseInt(partnerId, 10), price: partnerPrice ? parseFloat(partnerPrice) : null })
    }
  }

  function handleUnassign() {
    post({ type: 'unassign' })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ανάθεση</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLocked ? (
          /* Read-only view for completed/cancelled */
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {initialDriverId != null ? (
              <>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Οδηγός</p>
                  <p className="text-sm font-medium">
                    {drivers.find(d => d.id === initialDriverId)?.fullName ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Όχημα</p>
                  <p className="text-sm font-medium">
                    {initialVehicleId
                      ? (() => { const v = vehicles.find(v => v.id === initialVehicleId); return v ? `${v.name} (${v.plate})` : '—' })()
                      : '—'}
                  </p>
                </div>
              </>
            ) : initialPartnerId != null ? (
              <>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Συνεργάτης</p>
                  <p className="text-sm font-medium">
                    {partners.find(p => p.id === initialPartnerId)?.name ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Τιμή Ανάθεσης</p>
                  <p className="text-sm font-medium">
                    {initialPartnerPrice ? `€${parseFloat(initialPartnerPrice).toFixed(2)}` : '—'}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground col-span-3">Δεν έχει γίνει ανάθεση</p>
            )}
          </div>
        ) : (
          /* Interactive assignment form */
          <>
            {/* Mode toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('driver')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === 'driver'
                    ? 'bg-[#f9cf44] text-[#333333]'
                    : 'bg-[#333333] text-[#f9cf44] hover:bg-[#f9cf44] hover:text-[#333333]'
                }`}
              >
                Οδηγός & Όχημα
              </button>
              <button
                type="button"
                onClick={() => setMode('partner')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === 'partner'
                    ? 'bg-[#f9cf44] text-[#333333]'
                    : 'bg-[#333333] text-[#f9cf44] hover:bg-[#f9cf44] hover:text-[#333333]'
                }`}
              >
                Συνεργάτης
              </button>
            </div>

            {mode === 'driver' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Οδηγός *</Label>
                  <Select value={driverId} onValueChange={(v) => setDriverId(v ?? '')} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Επιλογή οδηγού" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map(d => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Όχημα *</Label>
                  <Select value={vehicleId} onValueChange={(v) => setVehicleId(v ?? '')} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Επιλογή οχήματος" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map(v => (
                        <SelectItem key={v.id} value={String(v.id)}>{v.name} ({v.plate})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Συνεργάτης *</Label>
                  <Select value={partnerId} onValueChange={(v) => setPartnerId(v ?? '')} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Επιλογή συνεργάτη" />
                    </SelectTrigger>
                    <SelectContent>
                      {partners.map(p => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partnerPrice">Τιμή Ανάθεσης</Label>
                  <Input
                    id="partnerPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={partnerPrice}
                    onChange={e => setPartnerPrice(e.target.value)}
                    disabled={loading}
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2 pt-1">
              <Button onClick={handleAssign} disabled={loading}>
                {loading ? 'Αποθήκευση…' : hasAssignment ? 'Ενημέρωση Ανάθεσης' : 'Ανάθεση'}
              </Button>
              {hasAssignment && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUnassign}
                  disabled={loading}
                >
                  Αναίρεση Ανάθεσης
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
