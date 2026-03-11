# Project Overview

## What it is
A web-based admin panel for a Thessaloniki passenger transfer company. It manages bookings received from multiple travel provider platforms, assigns them to drivers/vehicles or partner companies, and tracks financials.

## Language
- UI: Greek
- PDF output: Greek
- Code/comments: English

## Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Neon PostgreSQL + Drizzle ORM
- Custom session auth (HttpOnly cookies, SameSite=Strict, Cloudflare Turnstile)
- Cloudflare Pages deployment
- GitHub Actions CI/CD (push to main → migrate → build → deploy)
- Package manager: pnpm

## Phases
- **Phase A (current):** Admin panel + DB + intake API for email parser
- **Phase B (future):** Google Calendar sync per driver
- **Future:** WhatsApp channel, conversational AI

## Access
- Single admin role, full access
- Username + password login only
- No self-registration, no password recovery
- Password change available from within the panel
- New users added manually by developers

## Key Constraints
- Declared price is locked once a booking reaches `completed` status
- Assigned to partner → driver and vehicle are cleared (can be reversed)
- Provider updates to confirmed bookings (before pickup time) reset status to `pending` and clear assignment
- Round-trip bookings from providers are stored as two separate bookings, linked via `linked_booking_id`
