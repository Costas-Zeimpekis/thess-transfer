import { db } from '@/lib/db'
import { drivers } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'
import DriversClient from '@/components/drivers/drivers-client'

export default async function DriversPage() {
  const allDrivers = await db
    .select()
    .from(drivers)
    .orderBy(asc(drivers.fullName))

  return <DriversClient drivers={allDrivers} />
}
