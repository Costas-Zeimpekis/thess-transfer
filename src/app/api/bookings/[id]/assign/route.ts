import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bookings, bookingHistory } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
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

  const body = await request.json()
  const { type } = body

  let updateValues: Record<string, unknown> = {}
  let action: string

  if (type === 'driver') {
    const { driverId, vehicleId } = body
    if (!driverId || !vehicleId) {
      return NextResponse.json({ error: 'Απαιτούνται οδηγός και όχημα' }, { status: 400 })
    }
    updateValues = {
      driverId,
      vehicleId,
      partnerId: null,
      partnerAssignmentPrice: null,
      status: 'confirmed',
      updatedAt: new Date(),
    }
    action = 'assigned_driver'
  } else if (type === 'partner') {
    const { partnerId, price } = body
    if (!partnerId) {
      return NextResponse.json({ error: 'Απαιτείται συνεργάτης' }, { status: 400 })
    }
    updateValues = {
      partnerId,
      partnerAssignmentPrice: price != null ? String(price) : null,
      driverId: null,
      vehicleId: null,
      status: 'confirmed',
      updatedAt: new Date(),
    }
    action = 'assigned_partner'
  } else if (type === 'unassign') {
    updateValues = {
      driverId: null,
      vehicleId: null,
      partnerId: null,
      partnerAssignmentPrice: null,
      status: 'pending',
      updatedAt: new Date(),
    }
    action = 'unassigned'
  } else {
    return NextResponse.json({ error: 'Μη έγκυρος τύπος ανάθεσης' }, { status: 400 })
  }

  const result = await db
    .update(bookings)
    .set(updateValues)
    .where(eq(bookings.id, bookingId))
    .returning()

  await db.insert(bookingHistory).values({
    bookingId,
    action,
    source: 'manual',
    changedBy: session.user.id,
    changes: body,
  })

  return NextResponse.json(result[0])
}
