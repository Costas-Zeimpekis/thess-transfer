import BookingsClient from '@/components/bookings/bookings-client'
import { db } from '@/lib/db'
import { drivers, partners, providers, vehicles } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'

export default async function BookingsPage() {
  const [allProviders, allDrivers, allVehicles, allPartners] = await Promise.all([
    db.select().from(providers).orderBy(asc(providers.name)),
    db.select({ id: drivers.id, fullName: drivers.fullName }).from(drivers).orderBy(asc(drivers.fullName)),
    db.select({ id: vehicles.id, name: vehicles.name, plate: vehicles.plate }).from(vehicles).orderBy(asc(vehicles.name)),
    db.select({ id: partners.id, name: partners.name }).from(partners).orderBy(asc(partners.name)),
  ])

  return (
    <BookingsClient
      providers={allProviders}
      drivers={allDrivers}
      vehicles={allVehicles}
      partners={allPartners}
    />
  )
}
