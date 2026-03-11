import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { providerEmails } from '@/lib/db/schema'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { email, operation } = body

  if (!email || !operation) {
    return NextResponse.json({ error: 'Το email και η λειτουργία είναι υποχρεωτικά' }, { status: 400 })
  }

  const result = await db
    .insert(providerEmails)
    .values({
      providerId: Number(id),
      email,
      operation,
    })
    .returning()

  return NextResponse.json(result[0], { status: 201 })
}
