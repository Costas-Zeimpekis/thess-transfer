'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function NewDriverPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [idCard, setIdCard] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          id_card: idCard || null,
          phone: phone || null,
          email: email || null,
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

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Νέος Οδηγός</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
