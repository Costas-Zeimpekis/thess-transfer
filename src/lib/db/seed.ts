import 'dotenv/config'
import { db } from './index'
import { providers, providerEmails, users } from './schema'
import bcrypt from 'bcryptjs'

async function seed() {
  console.log('Seeding providers...')

  const providerData = [
    {
      name: 'Airports Taxi Transfers',
      slug: 'airports-taxi-transfers',
      emails: [{ email: 'bookings@airportstaxitransfers.com', operation: 'all' as const }],
    },
    {
      name: 'Foxtransfer EU',
      slug: 'foxtransfer-eu',
      emails: [{ email: 'info@foxtransfer.eu', operation: 'all' as const }],
    },
    {
      name: 'Cheap-Taxis',
      slug: 'cheap-taxis',
      emails: [{ email: 'bookings@cheap-taxis.com', operation: 'all' as const }],
    },
    {
      name: 'Talixo',
      slug: 'talixo',
      emails: [
        { email: 'info@talixo.de', operation: 'booking' as const },
        { email: 'do-not-reply@talixo.de', operation: 'modification' as const },
      ],
    },
    {
      name: 'ZIPTRANSFERS',
      slug: 'ziptransfers',
      emails: [{ email: 'reservations@ziptransfers.com', operation: 'all' as const }],
    },
    {
      name: 'JOURNEE',
      slug: 'journee',
      emails: [{ email: 'partnerships@journeetrips.com', operation: 'all' as const }],
    },
    {
      name: 'ShuttleDirect',
      slug: 'shuttledirect',
      emails: [{ email: 'blackhole@shuttledirect.com', operation: 'all' as const }],
    },
    {
      name: 'Mozio',
      slug: 'mozio',
      emails: [{ email: 'provider-do-not-reply@mozio.com', operation: 'all' as const }],
    },
    {
      name: 'Transfers Thessaloniki',
      slug: 'transfers-thessaloniki',
      emails: [{ email: 'info@transfersthessaloniki.com', operation: 'all' as const }],
    },
  ]

  for (const p of providerData) {
    const [inserted] = await db
      .insert(providers)
      .values({ name: p.name, slug: p.slug })
      .onConflictDoNothing()
      .returning({ id: providers.id })

    if (inserted) {
      for (const e of p.emails) {
        await db
          .insert(providerEmails)
          .values({ providerId: inserted.id, email: e.email, operation: e.operation })
          .onConflictDoNothing()
      }
    }
  }

  console.log('Seeding admin user...')
  const passwordHash = await bcrypt.hash('admin123', 12)
  await db
    .insert(users)
    .values({ username: 'admin', passwordHash })
    .onConflictDoNothing()

  console.log('Done! Default credentials: admin / admin123 — change immediately.')
}

seed().catch(console.error)
