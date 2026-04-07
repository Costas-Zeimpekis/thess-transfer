'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function CancelBookingButton({ bookingId }: { bookingId: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleCancel() {
    if (!confirm('Είστε σίγουρος ότι θέλετε να ακυρώσετε αυτή την κράτηση;')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: 'POST' })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error ?? 'Σφάλμα κατά την ακύρωση')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="destructive" onClick={handleCancel} disabled={loading}>
      {loading ? 'Ακύρωση…' : 'Ακύρωση Κράτησης'}
    </Button>
  )
}
