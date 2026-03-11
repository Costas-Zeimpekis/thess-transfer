# Setup Guide

## Local Development

### 1. Install dependencies
```bash
pnpm install
```

### 2. Environment variables
```bash
cp .env.example .env.local
```
Fill in `.env.local`:
```
DATABASE_URL=           # Neon connection string (neon.tech → project → connection string)
INTAKE_API_KEY=         # Any long random string, share with email parser service
SESSION_SECRET=         # Any long random string
TURNSTILE_SECRET_KEY=   # From Cloudflare Turnstile dashboard (use test key locally)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=  # From Cloudflare Turnstile dashboard
```

**Turnstile test keys (always pass, for local dev):**
```
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

### 3. Database
```bash
pnpm db:migrate    # create all tables
pnpm db:seed       # seed providers + default admin user (admin / admin123)
```
Change admin password immediately after first login.

### 4. Run dev server
```bash
pnpm dev
```

---

## Cloudflare Pages Deployment

### GitHub Secrets required
```
DATABASE_URL
INTAKE_API_KEY
SESSION_SECRET
TURNSTILE_SECRET_KEY
NEXT_PUBLIC_TURNSTILE_SITE_KEY
CF_API_TOKEN       # Cloudflare API token with Pages:Edit permission
CF_ACCOUNT_ID      # Cloudflare account ID
```

### CI/CD
Push to `main` → GitHub Actions runs migrations → builds → deploys to Cloudflare Pages.
Pipeline: `.github/workflows/deploy.yml`

### Cloudflare Cron Trigger (auto-complete bookings)
Add to `wrangler.toml`:
```toml
[triggers]
crons = ["*/30 * * * *"]
```
The cron handler marks `confirmed` bookings as `completed` when `pickup_datetime < NOW()`.

---

## Neon PostgreSQL

- Sign up at neon.tech (free tier sufficient to start)
- Create a new project
- Copy the connection string (includes SSL by default)
- Paste into `DATABASE_URL`

## Drizzle commands
```bash
pnpm db:generate   # generate migration files from schema changes
pnpm db:migrate    # apply pending migrations
pnpm db:studio     # open Drizzle Studio (visual DB browser)
pnpm db:seed       # run seed script
```
