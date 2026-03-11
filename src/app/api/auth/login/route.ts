import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createSession, setSessionCookie } from '@/lib/auth'

// Rate limiting: track failed attempts per IP
// Map key: IP, value: { count, windowStart }
const failedAttempts = new Map<string, { count: number; windowStart: number }>()

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = failedAttempts.get(ip)

  if (!record) return false

  // Reset if outside window
  if (now - record.windowStart > WINDOW_MS) {
    failedAttempts.delete(ip)
    return false
  }

  return record.count >= MAX_ATTEMPTS
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now()
  const record = failedAttempts.get(ip)

  if (!record || now - record.windowStart > WINDOW_MS) {
    failedAttempts.set(ip, { count: 1, windowStart: now })
  } else {
    record.count += 1
  }
}

function clearFailedAttempts(ip: string): void {
  failedAttempts.delete(ip)
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Πολλές αποτυχημένες προσπάθειες. Δοκιμάστε ξανά αργότερα.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { username, password } = body as { username?: string; password?: string }

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Λάθος όνομα χρήστη ή κωδικός' },
        { status: 401 }
      )
    }

    // Look up user
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1)

    const user = result[0]

    if (!user) {
      recordFailedAttempt(ip)
      return NextResponse.json(
        { error: 'Λάθος όνομα χρήστη ή κωδικός' },
        { status: 401 }
      )
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash)

    if (!passwordMatch) {
      recordFailedAttempt(ip)
      return NextResponse.json(
        { error: 'Λάθος όνομα χρήστη ή κωδικός' },
        { status: 401 }
      )
    }

    // Clear failed attempts on success
    clearFailedAttempts(ip)

    // Create session
    const sessionId = await createSession(user.id)
    const cookieOptions = setSessionCookie(sessionId)

    const response = NextResponse.json({ ok: true }, { status: 200 })
    response.cookies.set(cookieOptions)

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Σφάλμα διακομιστή' },
      { status: 500 }
    )
  }
}
