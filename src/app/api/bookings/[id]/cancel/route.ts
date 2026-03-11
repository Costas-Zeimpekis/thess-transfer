import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bookings, bookingHistory } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(_request: Request, context: RouteContext) {
  let session
  try {
    session = await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const bookingId = parseInt(id)

  const existing = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1)

  if (existing.length === 0) {
    return NextResponse.json({ error: 'Δεν βρέθηκε η κράτηση' }, { status: 404 })
  }

  const current = existing[0]

  if (current.status === 'completed') {
    return NextResponse.json(
      { error: 'Δεν μπορεί να ακυρωθεί ολοκληρωμένη κράτηση' },
      { status: 400 }
    )
  }

  const result = await db
    .update(bookings)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(bookings.id, bookingId))
    .returning()

  await db.insert(bookingHistory).values({
    bookingId,
    action: 'cancelled',
    source: 'manual',
    changedBy: session.user.id,
    changes: null,
  })

  return NextResponse.json(result[0])
}
