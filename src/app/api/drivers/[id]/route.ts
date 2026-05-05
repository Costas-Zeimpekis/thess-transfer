import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { drivers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const rows = await db.select().from(drivers).where(eq(drivers.id, Number(id))).limit(1)

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
  const { full_name, id_card, drivers_license, tax_id, phone, email, active } = body

  if (!full_name) {
    return NextResponse.json({ error: 'Το ονοματεπώνυμο είναι υποχρεωτικό' }, { status: 400 })
  }

  const result = await db
    .update(drivers)
    .set({
      fullName: full_name,
      idCard: id_card ?? null,
      driversLicense: drivers_license ?? null,
      taxId: tax_id ?? null,
      phone: phone ?? null,
      email: email ?? null,
      active: active ?? true,
      updatedAt: new Date(),
    })
    .where(eq(drivers.id, Number(id)))
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
    .update(drivers)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(drivers.id, Number(id)))
    .returning()

  if (!result[0]) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(result[0])
}
