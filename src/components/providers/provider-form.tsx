'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type ProviderEmail = {
  id: number
  providerId: number
  email: string
  operation: 'all' | 'booking' | 'modification' | 'cancellation'
}

type ProviderFormProps = {
  id?: string
}

const operationLabels: Record<string, string> = {
  all: 'Όλες',
  booking: 'Κράτηση',
  modification: 'Τροποποίηση',
  cancellation: 'Ακύρωση',
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function ProviderForm({ id }: ProviderFormProps) {
  const router = useRouter()
  const isEdit = !!id

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [taxId, setTaxId] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [emails, setEmails] = useState<ProviderEmail[]>([])

  const [newEmail, setNewEmail] = useState('')
  const [newOperation, setNewOperation] = useState<'all' | 'booking' | 'modification' | 'cancellation'>('all')
  const [addingEmail, setAddingEmail] = useState(false)
  const [emailError, setEmailError] = useState('')

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!name.trim()) errors.name = 'Το όνομα είναι υποχρεωτικό.'
    if (!slug.trim()) errors.slug = 'Το slug είναι υποχρεωτικό.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function clearFieldError(field: string) {
    setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
  }

  function handleNameChange(value: string) {
    setName(value)
    clearFieldError('name')
    if (!slugManual) {
      setSlug(slugify(value))
    }
  }

  function handleSlugChange(value: string) {
    setSlug(value)
    setSlugManual(true)
    clearFieldError('slug')
  }

  useEffect(() => {
    if (!isEdit) return

    async function loadProvider() {
      try {
        const res = await fetch(`/api/providers/${id}`)
        if (!res.ok) {
          setError('Ο πάροχος δεν βρέθηκε.')
          return
        }
        const provider = await res.json()
        setName(provider.name ?? '')
        setSlug(provider.slug ?? '')
        setTaxId(provider.taxId ?? '')
        setEmails(provider.emails ?? [])
        setSlugManual(true)
      } catch {
        setError('Σφάλμα φόρτωσης δεδομένων.')
      } finally {
        setFetching(false)
      }
    }

    loadProvider()
  }, [id, isEdit])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setError('')
    setLoading(true)

    try {
      const url = isEdit ? `/api/providers/${id}` : '/api/providers'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, tax_id: taxId || null }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Σφάλμα. Δοκιμάστε ξανά.')
        return
      }

      router.push('/providers')
    } catch {
      setError('Σφάλμα. Δοκιμάστε ξανά.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail.trim()) {
      setEmailError('Το email είναι υποχρεωτικό.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setEmailError('Μη έγκυρη διεύθυνση email.')
      return
    }
    setEmailError('')
    setAddingEmail(true)

    try {
      const res = await fetch(`/api/providers/${id}/emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, operation: newOperation }),
      })

      if (!res.ok) {
        const data = await res.json()
        setEmailError(data.error ?? 'Σφάλμα. Δοκιμάστε ξανά.')
        return
      }

      const added: ProviderEmail = await res.json()
      setEmails((prev) => [...prev, added])
      setNewEmail('')
      setNewOperation('all')
    } catch {
      setEmailError('Σφάλμα. Δοκιμάστε ξανά.')
    } finally {
      setAddingEmail(false)
    }
  }

  async function handleDeleteEmail(emailId: number) {
    await fetch(`/api/providers/${id}/emails/${emailId}`, { method: 'DELETE' })
    setEmails((prev) => prev.filter((e) => e.id !== emailId))
  }

  if (fetching) {
    return (
      <div className="max-w-lg">
        <p className="text-sm text-muted-foreground">Φόρτωση...</p>
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
          {isEdit ? 'Επεξεργασία Παρόχου' : 'Νέος Πάροχος'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="provName">Όνομα *</Label>
          <Input
            id="provName"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            disabled={loading}
            className={fieldErrors.name ? 'border-destructive' : ''}
          />
          {fieldErrors.name && (
            <p className="text-xs text-destructive">{fieldErrors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="provTaxId">ΑΦΜ</Label>
          <Input
            id="provTaxId"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="provSlug">Slug *</Label>
          <Input
            id="provSlug"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            disabled={loading}
            className={fieldErrors.slug ? 'border-destructive' : ''}
          />
          {fieldErrors.slug && (
            <p className="text-xs text-destructive">{fieldErrors.slug}</p>
          )}
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

      {/* Email management — edit mode only */}
      {isEdit && (
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold border-t pt-6">Emails παρόχου</h2>

          {emails.length > 0 ? (
            <div className="space-y-2">
              {emails.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm truncate">{e.email}</span>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {operationLabels[e.operation]}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteEmail(e.id)}
                    title="Διαγραφή email"
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Δεν υπάρχουν καταχωρημένα emails.</p>
          )}

          <form onSubmit={handleAddEmail} className="flex flex-col gap-3 pt-2 border-t">
            <p className="text-sm font-medium">Προσθήκη email</p>
            <div className="flex gap-2">
              <Input
                placeholder="email@example.com"
                value={newEmail}
                onChange={(e) => { setNewEmail(e.target.value); setEmailError('') }}
                disabled={addingEmail}
                className={`flex-1 ${emailError ? 'border-destructive' : ''}`}
              />
              <Select
                value={newOperation}
                onValueChange={(v) => setNewOperation(v as typeof newOperation)}
                disabled={addingEmail}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Όλες</SelectItem>
                  <SelectItem value="booking">Κράτηση</SelectItem>
                  <SelectItem value="modification">Τροποποίηση</SelectItem>
                  <SelectItem value="cancellation">Ακύρωση</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" size="icon" disabled={addingEmail} title="Προσθήκη">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {emailError && <p className="text-xs text-destructive">{emailError}</p>}
          </form>
        </div>
      )}
    </div>
  )
}
