'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import BookingSheet, { type BookingFormData } from './booking-sheet'

type Provider = { id: number; name: string }

type BookingDetailClientProps = {
  booking: BookingFormData
  providers: Provider[]
}

export default function BookingDetailClient({ booking, providers }: BookingDetailClientProps) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
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

  function handleSuccess() {
    router.refresh()
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setSheetOpen(true)}>
          Επεξεργασία
        </Button>
        {canCancel && (
          <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? 'Ακύρωση…' : 'Ακύρωση Κράτησης'}
          </Button>
        )}
      </div>

      <BookingSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        booking={booking}
        providers={providers}
        onSuccess={handleSuccess}
      />
    </>
  )
}
