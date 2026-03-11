'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
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

export type Vehicle = {
  id: number
  name: string
  plate: string
  type: 'car' | 'van' | 'bus'
  brand: string | null
  active: boolean | null
}

type VehicleSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle?: Vehicle | null
  onSuccess: () => void
}

const vehicleTypeLabels: Record<string, string> = {
  car: 'Επιβατικό',
  van: 'Βανάκι',
  bus: 'Λεωφορείο',
}

export default function VehicleSheet({ open, onOpenChange, vehicle, onSuccess }: VehicleSheetProps) {
  const isEdit = !!vehicle

  const [name, setName] = useState('')
  const [plate, setPlate] = useState('')
  const [type, setType] = useState<'car' | 'van' | 'bus'>('car')
  const [brand, setBrand] = useState('')
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      if (vehicle) {
        setName(vehicle.name)
        setPlate(vehicle.plate)
        setType(vehicle.type)
        setBrand(vehicle.brand ?? '')
        setActive(vehicle.active ?? true)
      } else {
        setName('')
        setPlate('')
        setType('car')
        setBrand('')
        setActive(true)
      }
      setError('')
    }
  }, [open, vehicle])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const url = isEdit ? `/api/vehicles/${vehicle!.id}` : '/api/vehicles'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          plate,
          type,
          brand: brand || null,
          ...(isEdit && { active }),
        }),
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
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Επεξεργασία Οχήματος' : 'Νέο Όχημα'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="vname">Όνομα *</Label>
            <Input
              id="vname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plate">Πινακίδα *</Label>
            <Input
              id="plate"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Τύπος *</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as 'car' | 'van' | 'bus')}
              disabled={loading}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="car">Επιβατικό</SelectItem>
                <SelectItem value="van">Βανάκι</SelectItem>
                <SelectItem value="bus">Λεωφορείο</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">Μάρκα</Label>
            <Input
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              disabled={loading}
            />
          </div>

          {isEdit && (
            <div className="flex items-center gap-2">
              <input
                id="vactive"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                disabled={loading}
                className="h-4 w-4"
              />
              <Label htmlFor="vactive">Ενεργό</Label>
            </div>
          )}

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
              {loading ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
