import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { deleteSession, clearSessionCookie } from '@/lib/auth'

const SESSION_COOKIE = 'tt_session'

export async function POST(_request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value

    if (sessionId) {
      await deleteSession(sessionId)
    }

    const cookieOptions = clearSessionCookie()
    const response = NextResponse.json({ ok: true }, { status: 200 })
    response.cookies.set(cookieOptions)

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Σφάλμα διακομιστή' },
      { status: 500 }
    )
  }
}
