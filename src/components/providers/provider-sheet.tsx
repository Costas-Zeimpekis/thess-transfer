'use client'

import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type ProviderEmail = {
  id: number
  providerId: number
  email: string
  operation: 'all' | 'booking' | 'modification' | 'cancellation'
}

export type Provider = {
  id: number
  name: string
  slug: string
  emails: ProviderEmail[]
}

type ProviderSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider?: Provider | null
  onSuccess: () => void
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

export default function ProviderSheet({ open, onOpenChange, provider, onSuccess }: ProviderSheetProps) {
  const isEdit = !!provider

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [emails, setEmails] = useState<ProviderEmail[]>([])

  const [newEmail, setNewEmail] = useState('')
  const [newOperation, setNewOperation] = useState<'all' | 'booking' | 'modification' | 'cancellation'>('all')
  const [addingEmail, setAddingEmail] = useState(false)
  const [emailError, setEmailError] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      if (provider) {
        setName(provider.name)
        setSlug(provider.slug)
        setEmails(provider.emails)
        setSlugManual(true)
      } else {
        setName('')
        setSlug('')
        setEmails([])
        setSlugManual(false)
      }
      setError('')
      setEmailError('')
      setNewEmail('')
      setNewOperation('all')
    }
  }, [open, provider])

  function handleNameChange(value: string) {
    setName(value)
    if (!slugManual) {
      setSlug(slugify(value))
    }
  }

  function handleSlugChange(value: string) {
    setSlug(value)
    setSlugManual(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const url = isEdit ? `/api/providers/${provider!.id}` : '/api/providers'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
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

  async function handleAddEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!provider) return
    setEmailError('')
    setAddingEmail(true)

    try {
      const res = await fetch(`/api/providers/${provider.id}/emails`, {
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
      onSuccess()
    } catch {
      setEmailError('Σφάλμα. Δοκιμάστε ξανά.')
    } finally {
      setAddingEmail(false)
    }
  }

  async function handleDeleteEmail(emailId: number) {
    if (!provider) return
    await fetch(`/api/providers/${provider.id}/emails/${emailId}`, { method: 'DELETE' })
    setEmails((prev) => prev.filter((e) => e.id !== emailId))
    onSuccess()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Επεξεργασία Παρόχου' : 'Νέος Πάροχος'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="provName">Όνομα *</Label>
            <Input
              id="provName"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provSlug">Slug *</Label>
            <Input
              id="provSlug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              required
              disabled={loading}
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
              {loading ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </Button>
          </SheetFooter>
        </form>

        {isEdit && (
          <div className="mt-4 border-t pt-4 flex flex-col gap-4">
            <h3 className="font-medium text-sm">Διευθύνσεις Email</h3>

            {emails.length > 0 && (
              <div className="rounded-md border divide-y">
                {emails.map((e) => (
                  <div key={e.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{e.email}</span>
                      <Badge variant="outline">{operationLabels[e.operation] ?? e.operation}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteEmail(e.id)}
                      title="Διαγραφή email"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddEmail} className="flex flex-col gap-3">
              <div className="space-y-2">
                <Label htmlFor="newEmail">Νέο Email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  disabled={addingEmail}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newOperation">Λειτουργία</Label>
                <Select
                  value={newOperation}
                  onValueChange={(v) => setNewOperation(v as typeof newOperation)}
                  disabled={addingEmail}
                >
                  <SelectTrigger id="newOperation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Όλες</SelectItem>
                    <SelectItem value="booking">Κράτηση</SelectItem>
                    <SelectItem value="modification">Τροποποίηση</SelectItem>
                    <SelectItem value="cancellation">Ακύρωση</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {emailError && <p className="text-sm text-destructive">{emailError}</p>}
              <Button type="submit" variant="outline" disabled={addingEmail}>
                {addingEmail ? 'Προσθήκη...' : 'Προσθήκη Email'}
              </Button>
            </form>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
