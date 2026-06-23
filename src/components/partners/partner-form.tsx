'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

type PartnerFormProps = {
  id?: string
}

export default function PartnerForm({ id }: PartnerFormProps) {
  const router = useRouter()
  const isEdit = !!id

  const [name, setName] = useState('')
  const [taxId, setTaxId] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!name.trim()) errors.name = 'Η επωνυμία είναι υποχρεωτική.'
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

    async function loadPartner() {
      try {
        const res = await fetch(`/api/partners/${id}`)
        if (!res.ok) {
          setError('Ο συνεργάτης δεν βρέθηκε.')
          return
        }
        const partner = await res.json()
        setName(partner.name ?? '')
        setTaxId(partner.taxId ?? '')
        setEmail(partner.email ?? '')
        setPhone(partner.phone ?? '')
        setContactInfo(partner.contactInfo ?? '')
      } catch {
        setError('Σφάλμα φόρτωσης δεδομένων.')
      } finally {
        setFetching(false)
      }
    }

    loadPartner()
  }, [id, isEdit])

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/partners/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Σφάλμα διαγραφής.')
        return
      }
      router.push('/partners')
    } catch {
      setError('Σφάλμα διαγραφής.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!validate()) return
    setLoading(true)

    try {
      const res = await fetch(isEdit ? `/api/partners/${id}` : '/api/partners', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          tax_id: taxId || null,
          email: email || null,
          phone: phone || null,
          contact_info: contactInfo || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Σφάλμα. Δοκιμάστε ξανά.')
        return
      }

      router.push('/partners')
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
          {isEdit ? 'Επεξεργασία Συνεργάτη' : 'Νέος Συνεργάτης'}
        </h1>
        {isEdit && (
          <div className="ml-auto">
            <Dialog>
              <DialogTrigger render={<Button variant="destructive" size="sm" disabled={loading || deleting} />}>
                <Trash2 className="h-4 w-4 mr-2" />
                Διαγραφή
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Διαγραφή Συνεργάτη</DialogTitle>
                  <DialogDescription>
                    Είστε σίγουροι ότι θέλετε να διαγράψετε τον συνεργάτη <strong>{name}</strong>; Η ενέργεια αυτή δεν μπορεί να αναιρεθεί.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" disabled={deleting} />}>
                    Ακύρωση
                  </DialogClose>
                  <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Διαγραφή...' : 'Διαγραφή'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pname" className={fieldErrors.name ? 'text-red-500' : ''}>
            Επωνυμία *
          </Label>
          <Input
            id="pname"
            value={name}
            onChange={(e) => { setName(e.target.value); clearFieldError('name') }}
            className={fieldErrors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
            disabled={loading}
          />
          {fieldErrors.name && <p className="text-xs text-red-500">{fieldErrors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="taxId">ΑΦΜ</Label>
          <Input
            id="taxId"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pemail" className={fieldErrors.email ? 'text-red-500' : ''}>
            Email
          </Label>
          <Input
            id="pemail"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearFieldError('email') }}
            className={fieldErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
            disabled={loading}
          />
          {fieldErrors.email && <p className="text-xs text-red-500">{fieldErrors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="pphone">Τηλέφωνο</Label>
          <Input
            id="pphone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactInfo">Στοιχεία επικοινωνίας</Label>
          <Textarea
            id="contactInfo"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            disabled={loading}
            rows={3}
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
