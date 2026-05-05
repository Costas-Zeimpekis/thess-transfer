import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { providers, providerEmails } from '@/lib/db/schema'
import { asc, eq } from 'drizzle-orm'

export async function GET() {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await db
    .select()
    .from(providers)
    .orderBy(asc(providers.name))

  const emails = await db.select().from(providerEmails)

  const result = rows.map((provider) => ({
    ...provider,
    emails: emails.filter((e) => e.providerId === provider.id),
  }))

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, slug, tax_id } = body

  if (!name || !slug) {
    return NextResponse.json({ error: 'Το όνομα και το slug είναι υποχρεωτικά' }, { status: 400 })
  }

  const result = await db
    .insert(providers)
    .values({ name, slug, taxId: tax_id ?? null })
    .returning()

  const newProvider = result[0]
  return NextResponse.json({ ...newProvider, emails: [] }, { status: 201 })
}
