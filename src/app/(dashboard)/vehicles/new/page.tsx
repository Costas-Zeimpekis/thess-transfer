'use client'

import { useState } from 'react'
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

export default function NewVehiclePage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [plate, setPlate] = useState('')
  const [type, setType] = useState('car')
  const [brand, setBrand] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          plate,
          type,
          brand: brand || null,
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

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Νέο Όχημα</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <Label>Τύπος *</Label>
          <Select value={type} onValueChange={(v) => setType(v ?? 'car')} disabled={loading}>
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

        <div className="space-y-2">
          <Label htmlFor="brand">Μάρκα</Label>
          <Input
            id="brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            disabled={loading}
          />
        </div>

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
