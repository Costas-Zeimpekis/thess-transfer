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

export type Driver = {
  id: number
  fullName: string
  idCard: string | null
  phone: string | null
  email: string | null
  active: boolean | null
}

type DriverSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  driver?: Driver | null
  onSuccess: () => void
}

export default function DriverSheet({ open, onOpenChange, driver, onSuccess }: DriverSheetProps) {
  const isEdit = !!driver

  const [fullName, setFullName] = useState('')
  const [idCard, setIdCard] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      if (driver) {
        setFullName(driver.fullName)
        setIdCard(driver.idCard ?? '')
        setPhone(driver.phone ?? '')
        setEmail(driver.email ?? '')
        setActive(driver.active ?? true)
      } else {
        setFullName('')
        setIdCard('')
        setPhone('')
        setEmail('')
        setActive(true)
      }
      setError('')
    }
  }, [open, driver])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const url = isEdit ? `/api/drivers/${driver!.id}` : '/api/drivers'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          id_card: idCard || null,
          phone: phone || null,
          email: email || null,
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
          <SheetTitle>{isEdit ? 'Επεξεργασία Οδηγού' : 'Νέος Οδηγός'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Ονοματεπώνυμο *</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="idCard">Αριθμός Ταυτότητας</Label>
            <Input
              id="idCard"
              value={idCard}
              onChange={(e) => setIdCard(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Τηλέφωνο</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          {isEdit && (
            <div className="flex items-center gap-2">
              <input
                id="active"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                disabled={loading}
                className="h-4 w-4"
              />
              <Label htmlFor="active">Ενεργός</Label>
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
