import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { partners } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const rows = await db.select().from(partners).where(eq(partners.id, Number(id))).limit(1)

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
  const { name, email, phone, contact_info } = body

  if (!name) {
    return NextResponse.json({ error: 'Η επωνυμία είναι υποχρεωτική' }, { status: 400 })
  }

  const result = await db
    .update(partners)
    .set({
      name,
      email: email ?? null,
      phone: phone ?? null,
      contactInfo: contact_info ?? null,
      updatedAt: new Date(),
    })
    .where(eq(partners.id, Number(id)))
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
    .delete(partners)
    .where(eq(partners.id, Number(id)))
    .returning()

  if (!result[0]) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
