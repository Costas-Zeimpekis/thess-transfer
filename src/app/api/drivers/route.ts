import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { drivers } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'

export async function GET() {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await db
    .select()
    .from(drivers)
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
  const { full_name, id_card, phone, email } = body

  if (!full_name) {
    return NextResponse.json({ error: 'Το ονοματεπώνυμο είναι υποχρεωτικό' }, { status: 400 })
  }

  const result = await db
    .insert(drivers)
    .values({
      fullName: full_name,
      idCard: id_card ?? null,
      phone: phone ?? null,
      email: email ?? null,
      active: true,
    })
    .returning()

  return NextResponse.json(result[0], { status: 201 })
}
