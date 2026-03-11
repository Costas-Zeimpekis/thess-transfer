import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { partners } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'

export async function GET() {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await db
    .select()
    .from(partners)
    .orderBy(asc(partners.name))

  return NextResponse.json(rows)
}

export async function POST(request: Request) {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, email, phone, contact_info } = body

  if (!name) {
    return NextResponse.json({ error: 'Η επωνυμία είναι υποχρεωτική' }, { status: 400 })
  }

  const result = await db
    .insert(partners)
    .values({
      name,
      email: email ?? null,
      phone: phone ?? null,
      contactInfo: contact_info ?? null,
    })
    .returning()

  return NextResponse.json(result[0], { status: 201 })
}
