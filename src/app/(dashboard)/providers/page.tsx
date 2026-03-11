import { db } from '@/lib/db'
import { providers, providerEmails } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'
import ProvidersClient from '@/components/providers/providers-client'

export default async function ProvidersPage() {
  const allProviders = await db
    .select()
    .from(providers)
    .orderBy(asc(providers.name))

  const allEmails = await db.select().from(providerEmails)

  const data = allProviders.map((p) => ({
    ...p,
    emails: allEmails.filter((e) => e.providerId === p.id),
  }))

  return <ProvidersClient providers={data} />
}
