'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button'
import type { BookingFormData } from './booking-sheet'

type BookingDetailClientProps = {
  booking: BookingFormData
  providers?: { id: number; name: string }[]
}

export default function BookingDetailClient({ booking }: BookingDetailClientProps) {
  const router = useRouter()
  const [cancelling, setCancelling] = useState(false)

  const canCancel = booking.status !== 'completed' && booking.status !== 'cancelled'

  async function handleCancel() {
    if (!confirm('Είστε σίγουρος ότι θέλετε να ακυρώσετε αυτή την κράτηση;')) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, { method: 'POST' })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error ?? 'Σφάλμα κατά την ακύρωση')
      }
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Link href={`/bookings/${booking.id}/edit`} className={buttonVariants({ variant: 'outline' })}>
        Επεξεργασία
      </Link>
      {canCancel && (
        <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
          {cancelling ? 'Ακύρωση…' : 'Ακύρωση Κράτησης'}
        </Button>
      )}
    </div>
  )
}
