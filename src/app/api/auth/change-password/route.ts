import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const authData = await requireAuth()
    const { user } = authData

    const body = await request.json()
    const { currentPassword, newPassword } = body as {
      currentPassword?: string
      newPassword?: string
    }

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Παρακαλώ συμπληρώστε όλα τα πεδία' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Ο νέος κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες' },
        { status: 400 }
      )
    }

    // Validate current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Ο τρέχων κωδικός είναι λάθος' },
        { status: 401 }
      )
    }

    // Hash and update new password
    const newHash = await bcrypt.hash(newPassword, 12)

    await db
      .update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, user.id))

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Μη εξουσιοδοτημένη πρόσβαση' },
        { status: 401 }
      )
    }
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Σφάλμα διακομιστή' },
      { status: 500 }
    )
  }
}
