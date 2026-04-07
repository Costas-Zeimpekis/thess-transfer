'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function NewProviderPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
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

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Νέος Πάροχος</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
