import { db } from '@/lib/db'
import { drivers } from '@/lib/db/schema'
import { asc, eq } from 'drizzle-orm'
import DriversClient from '@/components/drivers/drivers-client'

export default async function DriversPage() {
  const allDrivers = await db
    .select()
    .from(drivers)
    .where(eq(drivers.active, true))
    .orderBy(asc(drivers.fullName))

  return <DriversClient drivers={allDrivers} />
}
