import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { vehicles } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'

export async function GET() {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await db
    .select()
    .from(vehicles)
    .orderBy(asc(vehicles.name))

  return NextResponse.json(rows)
}

export async function POST(request: Request) {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, plate, type, brand } = body

  if (!name || !plate || !type) {
    return NextResponse.json({ error: 'Τα πεδία Όνομα, Πινακίδα και Τύπος είναι υποχρεωτικά' }, { status: 400 })
  }

  const result = await db
    .insert(vehicles)
    .values({
      name,
      plate,
      type,
      brand: brand ?? null,
      active: true,
    })
    .returning()

  return NextResponse.json(result[0], { status: 201 })
}
