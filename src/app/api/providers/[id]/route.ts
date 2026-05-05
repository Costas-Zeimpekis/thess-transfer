import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { providers, providerEmails } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const rows = await db.select().from(providers).where(eq(providers.id, Number(id))).limit(1)

  if (!rows[0]) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const emails = await db
    .select()
    .from(providerEmails)
    .where(eq(providerEmails.providerId, Number(id)))

  return NextResponse.json({ ...rows[0], emails })
}

export async function PUT(request: Request, { params }: Params) {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { name, slug, tax_id } = body

  if (!name || !slug) {
    return NextResponse.json({ error: 'Το όνομα και το slug είναι υποχρεωτικά' }, { status: 400 })
  }

  const result = await db
    .update(providers)
    .set({ name, slug, taxId: tax_id ?? null, updatedAt: new Date() })
    .where(eq(providers.id, Number(id)))
    .returning()

  if (!result[0]) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const emails = await db
    .select()
    .from(providerEmails)
    .where(eq(providerEmails.providerId, Number(id)))

  return NextResponse.json({ ...result[0], emails })
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const result = await db
    .delete(providers)
    .where(eq(providers.id, Number(id)))
    .returning()

  if (!result[0]) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
