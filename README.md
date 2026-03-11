# Thess Transfers — Booking Management System

An admin panel for managing passenger transfers in Thessaloniki. Handles bookings from multiple travel providers, driver/vehicle assignment, partner companies, and financial tracking.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Neon PostgreSQL + Drizzle ORM
- **Auth:** Custom session-based (HttpOnly cookies + Cloudflare Turnstile)
- **Deployment:** Cloudflare Pages
- **CI/CD:** GitHub Actions

## Features

- Booking management with full lifecycle: `pending → confirmed → completed → cancelled`
- Automated booking intake via API (email parser integration)
- Driver, vehicle, partner, and provider management
- Google Calendar sync per driver (Phase B)
- Printable PDF movement sheets (Greek)
- Micro-expenses tracking
- Custom fields per entity type (configurable without code changes)
- Booking list with live totals: real price, declared price, difference

## Supported Providers

| Provider | Email(s) |
|---|---|
| Airports Taxi Transfers | bookings@airportstaxitransfers.com |
| Foxtransfer EU | info@foxtransfer.eu |
| Cheap-Taxis | bookings@cheap-taxis.com |
| Talixo | info@talixo.de / do-not-reply@talixo.de |
| ZIPTRANSFERS | reservations@ziptransfers.com |
| JOURNEE | partnerships@journeetrips.com |
| ShuttleDirect | blackhole@shuttledirect.com |
| Mozio | provider-do-not-reply@mozio.com |
| Transfers Thessaloniki (own site) | info@transfersthessaloniki.com |

## Intake API

The external email parser sends structured booking data to:

```
POST   /api/intake/booking   → create booking (status: pending)
PUT    /api/intake/booking   → update booking (by provider_email + provider_booking_ref)
DELETE /api/intake/booking   → cancel booking (by provider_email + provider_booking_ref)
```

All requests require `Authorization: Bearer <INTAKE_API_KEY>`.

## Getting Started

```bash
pnpm install
cp .env.example .env.local
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Environment Variables

```
DATABASE_URL=                        # Neon PostgreSQL connection string
INTAKE_API_KEY=                      # Secret for the email parser service
SESSION_SECRET=                      # Secret for signing session cookies
TURNSTILE_SECRET_KEY=                # Cloudflare Turnstile secret
NEXT_PUBLIC_TURNSTILE_SITE_KEY=      # Cloudflare Turnstile site key
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/
│   ├── (dashboard)/
│   │   ├── bookings/
│   │   ├── drivers/
│   │   ├── vehicles/
│   │   ├── partners/
│   │   ├── providers/
│   │   └── micro-expenses/
│   └── api/
│       ├── auth/
│       ├── intake/booking/
│       ├── bookings/
│       ├── drivers/
│       ├── vehicles/
│       ├── partners/
│       └── micro-expenses/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── bookings/
│   └── pdf/
└── lib/
    ├── db/
    │   ├── schema.ts
    │   └── index.ts
    └── auth.ts
```
