import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { sessions, users } from '@/lib/db/schema'
import { eq, gt } from 'drizzle-orm'

const SESSION_COOKIE = 'tt_session'
const SESSION_DURATION_DAYS = 7

export async function getSession() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value
  if (!sessionId) return null

  const result = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .limit(1)

  const row = result[0]
  if (!row) return null

  if (new Date(row.session.expiresAt!) < new Date()) {
    await db.delete(sessions).where(eq(sessions.id, sessionId))
    return null
  }

  return { session: row.session, user: row.user }
}

export async function requireAuth() {
  const data = await getSession()
  if (!data) {
    throw new Error('Unauthorized')
  }
  return data
}

export async function createSession(userId: number): Promise<string> {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS)

  const result = await db
    .insert(sessions)
    .values({ userId, expiresAt })
    .returning({ id: sessions.id })

  return result[0].id
}

export async function deleteSession(sessionId: string) {
  await db.delete(sessions).where(eq(sessions.id, sessionId))
}

export function setSessionCookie(sessionId: string) {
  return {
    name: SESSION_COOKIE,
    value: sessionId,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * SESSION_DURATION_DAYS,
  }
}

export function clearSessionCookie() {
  return {
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 0,
  }
}
