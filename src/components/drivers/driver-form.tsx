'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type DriverFormProps = {
  id?: string
}

export default function DriverForm({ id }: DriverFormProps) {
  const router = useRouter()
  const isEdit = !!id

  const [fullName, setFullName] = useState('')
  const [idCard, setIdCard] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!fullName.trim()) errors.fullName = 'Το ονοματεπώνυμο είναι υποχρεωτικό.'
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = 'Μη έγκυρη διεύθυνση email.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function clearFieldError(field: string) {
    setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
  }

  useEffect(() => {
    if (!isEdit) return

    async function loadDriver() {
      try {
        const res = await fetch(`/api/drivers/${id}`)
        if (!res.ok) {
          setError('Ο οδηγός δεν βρέθηκε.')
          return
        }
        const driver = await res.json()
        setFullName(driver.fullName ?? '')
        setIdCard(driver.idCard ?? '')
        setPhone(driver.phone ?? '')
        setEmail(driver.email ?? '')
        setActive(driver.active ?? true)
      } catch {
        setError('Σφάλμα φόρτωσης δεδομένων.')
      } finally {
        setFetching(false)
      }
    }

    loadDriver()
  }, [id, isEdit])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!validate()) return
    setLoading(true)

    try {
      const res = await fetch(isEdit ? `/api/drivers/${id}` : '/api/drivers', {
        method: isEdit ? 'PUT' : 'POST',
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

      router.push('/drivers')
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
          {isEdit ? 'Επεξεργασία Οδηγού' : 'Νέος Οδηγός'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className={fieldErrors.fullName ? 'text-red-500' : ''}>
            Ονοματεπώνυμο *
          </Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => { setFullName(e.target.value); clearFieldError('fullName') }}
            className={fieldErrors.fullName ? 'border-red-500 focus-visible:ring-red-500' : ''}
            disabled={loading}
          />
          {fieldErrors.fullName && <p className="text-xs text-red-500">{fieldErrors.fullName}</p>}
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
          <Label htmlFor="email" className={fieldErrors.email ? 'text-red-500' : ''}>Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearFieldError('email') }}
            className={fieldErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
            disabled={loading}
          />
          {fieldErrors.email && <p className="text-xs text-red-500">{fieldErrors.email}</p>}
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
