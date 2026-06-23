import { db } from '@/lib/db'
import { vehicles } from '@/lib/db/schema'
import { asc, eq } from 'drizzle-orm'
import VehiclesClient from '@/components/vehicles/vehicles-client'

export default async function VehiclesPage() {
  const allVehicles = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.active, true))
    .orderBy(asc(vehicles.name))

  return <VehiclesClient vehicles={allVehicles} />
}
