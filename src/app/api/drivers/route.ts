import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { drivers } from '@/lib/db/schema'
import { asc, eq } from 'drizzle-orm'

export async function GET() {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await db
    .select()
    .from(drivers)
    .where(eq(drivers.active, true))
    .orderBy(asc(drivers.fullName))

  return NextResponse.json(rows)
}

export async function POST(request: Request) {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { full_name, id_card, drivers_license, tax_id, phone, email, google_calendar_id } = body

  if (!full_name) {
    return NextResponse.json({ error: 'Το ονοματεπώνυμο είναι υποχρεωτικό' }, { status: 400 })
  }

  const result = await db
    .insert(drivers)
    .values({
      fullName: full_name,
      idCard: id_card ?? null,
      driversLicense: drivers_license ?? null,
      taxId: tax_id ?? null,
      phone: phone ?? null,
      email: email ?? null,
      googleCalendarId: google_calendar_id ?? null,
      active: true,
    })
    .returning()

  return NextResponse.json(result[0], { status: 201 })
}
