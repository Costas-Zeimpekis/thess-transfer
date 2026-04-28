# ARCHITECTURE.md — Project Structure

## Stack
- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database:** Neon PostgreSQL + Drizzle ORM
- **Auth:** Custom session auth — HttpOnly cookie `tt_session`, no NextAuth
- **Deployment:** Cloudflare Pages (CI/CD via GitHub Actions on push to main)
- **Package manager:** pnpm

## Directory Map

```
/
├── docs/                    # Spec docs — read these for project intent
│   ├── overview.md
│   ├── schema.md
│   ├── business-logic.md
│   ├── api.md
│   ├── ui.md
│   ├── providers.md
│   └── setup.md
│
├── migrations/              # Drizzle migration files (auto-generated)
│
├── src/
│   ├── app/
│   │   ├── (auth)/          # Unauthenticated routes
│   │   │   └── login/
│   │   ├── (dashboard)/     # Authenticated routes — wrapped in dashboard shell
│   │   │   ├── bookings/    # List, [id] detail, new
│   │   │   ├── drivers/     # List, [id] detail
│   │   │   ├── vehicles/    # List, [id] detail
│   │   │   ├── partners/    # List, [id] detail
│   │   │   ├── providers/   # List
│   │   │   └── micro-expenses/
│   │   ├── api/             # Internal API routes (Next.js route handlers)
│   │   │   ├── auth/        # login, logout, session
│   │   │   ├── bookings/
│   │   │   ├── drivers/
│   │   │   ├── vehicles/
│   │   │   ├── partners/
│   │   │   ├── providers/
│   │   │   ├── micro-expenses/
│   │   │   └── intake/      # Intake API (Bearer token auth)
│   │   ├── pdf/             # PDF route (server-side @react-pdf/renderer)
│   │   ├── layout.tsx       # Root layout
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/              # shadcn/ui primitives (Button, Input, Dialog, etc.)
│   │   ├── bookings/        # Booking-specific components
│   │   ├── drivers/
│   │   ├── vehicles/
│   │   └── partners/
│   │
│   ├── hooks/
│   │   └── use-mobile.ts    # Responsive hook
│   │
│   └── lib/
│       ├── db/
│       │   ├── schema.ts    # Drizzle schema — single source of truth for DB
│       │   ├── index.ts     # Drizzle client (Neon serverless)
│       │   └── seed.ts      # Seeds 9 providers + admin user
│       ├── auth.ts          # Session helpers (getSession, requireAuth)
│       ├── intake-auth.ts   # Bearer token check for intake API
│       └── utils.ts         # cn() and general utilities
│
├── middleware.ts            # Auth middleware — protects /dashboard routes
├── drizzle.config.ts
└── components.json          # shadcn/ui config
```

## Routing Patterns
- `(auth)` group — public, no sidebar
- `(dashboard)` group — all routes require valid session; middleware redirects to `/login`
- API routes follow REST conventions: `GET /api/bookings`, `POST /api/bookings`, etc.
- Intake API at `/api/intake/booking` — identified by `Authorization: Bearer <INTAKE_API_KEY>`

## State Management
- No global state library. Server Components fetch data directly.
- Client interactivity via React state (`useState`) in Client Components.
- Forms use controlled inputs; submission via `fetch` to internal API routes.
- No React Query or SWR — plain fetch + router.refresh() on mutations.

## Auth Flow
1. `POST /api/auth/login` → validates credentials → creates session row → sets `tt_session` cookie
2. `middleware.ts` reads cookie → validates session → redirects if invalid
3. `src/lib/auth.ts` → `getSession()` / `requireAuth()` used in server components and route handlers

## Database Access
- Always use Drizzle ORM — never raw SQL unless impossible otherwise
- Schema lives in `src/lib/db/schema.ts` — modify here, then `pnpm db:generate && pnpm db:migrate`
- JSONB `custom_fields` column exists on: bookings, drivers, vehicles, partners, micro_expenses
