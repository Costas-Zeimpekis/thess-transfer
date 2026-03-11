import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { vehicles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const rows = await db.select().from(vehicles).where(eq(vehicles.id, Number(id))).limit(1)

  if (!rows[0]) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(rows[0])
}

export async function PUT(request: Request, { params }: Params) {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { name, plate, type, brand, active } = body

  if (!name || !plate || !type) {
    return NextResponse.json({ error: 'Τα πεδία Όνομα, Πινακίδα και Τύπος είναι υποχρεωτικά' }, { status: 400 })
  }

  const result = await db
    .update(vehicles)
    .set({
      name,
      plate,
      type,
      brand: brand ?? null,
      active: active ?? true,
      updatedAt: new Date(),
    })
    .where(eq(vehicles.id, Number(id)))
    .returning()

  if (!result[0]) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(result[0])
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const result = await db
    .update(vehicles)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(vehicles.id, Number(id)))
    .returning()

  if (!result[0]) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(result[0])
}
