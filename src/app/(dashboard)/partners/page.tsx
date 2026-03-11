import { db } from '@/lib/db'
import { partners } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'
import PartnersClient from '@/components/partners/partners-client'

export default async function PartnersPage() {
  const allPartners = await db
    .select()
    .from(partners)
    .orderBy(asc(partners.name))

  return <PartnersClient partners={allPartners} />
}
