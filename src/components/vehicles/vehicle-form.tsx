'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
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

type VehicleFormProps = {
  id?: string
}

export default function VehicleForm({ id }: VehicleFormProps) {
  const router = useRouter()
  const isEdit = !!id

  const [name, setName] = useState('')
  const [plate, setPlate] = useState('')
  const [type, setType] = useState<'car' | 'van' | 'bus'>('car')
  const [brand, setBrand] = useState('')
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!name.trim()) errors.name = 'Το όνομα είναι υποχρεωτικό.'
    if (!plate.trim()) errors.plate = 'Η πινακίδα είναι υποχρεωτική.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function clearFieldError(field: string) {
    setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
  }

  useEffect(() => {
    if (!isEdit) return

    async function loadVehicle() {
      try {
        const res = await fetch(`/api/vehicles/${id}`)
        if (!res.ok) {
          setError('Το όχημα δεν βρέθηκε.')
          return
        }
        const vehicle = await res.json()
        setName(vehicle.name ?? '')
        setPlate(vehicle.plate ?? '')
        setType(vehicle.type ?? 'car')
        setBrand(vehicle.brand ?? '')
        setActive(vehicle.active ?? true)
      } catch {
        setError('Σφάλμα φόρτωσης δεδομένων.')
      } finally {
        setFetching(false)
      }
    }

    loadVehicle()
  }, [id, isEdit])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!validate()) return
    setLoading(true)

    try {
      const res = await fetch(isEdit ? `/api/vehicles/${id}` : '/api/vehicles', {
        method: isEdit ? 'PUT' : 'POST',
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

      router.push('/vehicles')
    } catch {
      setError('Σφάλμα. Δοκιμάστε ξανά.')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="max-w-lg">
        <p className="text-muted-foreground">Φόρτωση...</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">
          {isEdit ? 'Επεξεργασία Οχήματος' : 'Νέο Όχημα'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="vname" className={fieldErrors.name ? 'text-red-500' : ''}>
            Όνομα *
          </Label>
          <Input
            id="vname"
            value={name}
            onChange={(e) => { setName(e.target.value); clearFieldError('name') }}
            className={fieldErrors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
            disabled={loading}
          />
          {fieldErrors.name && <p className="text-xs text-red-500">{fieldErrors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="plate" className={fieldErrors.plate ? 'text-red-500' : ''}>
            Πινακίδα *
          </Label>
          <Input
            id="plate"
            value={plate}
            onChange={(e) => { setPlate(e.target.value); clearFieldError('plate') }}
            className={fieldErrors.plate ? 'border-red-500 focus-visible:ring-red-500' : ''}
            disabled={loading}
          />
          {fieldErrors.plate && <p className="text-xs text-red-500">{fieldErrors.plate}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="vtype">Τύπος *</Label>
          <Select value={type} onValueChange={(v) => setType(v as 'car' | 'van' | 'bus')} disabled={loading}>
            <SelectTrigger id="vtype">
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

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            Ακύρωση
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Αποθήκευση...' : 'Αποθήκευση'}
          </Button>
        </div>
      </form>
    </div>
  )
}
