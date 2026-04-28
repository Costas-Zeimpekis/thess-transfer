# Constitution — Project Rules & Laws

## Identity
**Project:** Thess Transfers Admin Panel
**Domain:** Passenger transfer management for Thessaloniki-based company
**Phase:** A (admin panel + intake API). Phase B = Google Calendar sync.

## Inviolable Rules

### Data Integrity
1. `declared_price` MUST be locked (read-only) once a booking status is `completed`. Never allow edits.
2. A booking can NEVER be assigned to both a partner AND a driver+vehicle simultaneously. They are mutually exclusive. Assigning one clears the other.
3. `completed` bookings cannot be cancelled via any path — UI or API.
4. Intake API UPDATE on a `completed` booking must return HTTP 409.

### Status Transitions
Only these transitions are legal:
- `pending` → `confirmed` (admin assigns driver+vehicle or partner)
- `confirmed` → `completed` (auto cron only, when pickup_datetime passes)
- `confirmed` → `pending` (intake API UPDATE before pickup — clears assignment)
- `pending | confirmed` → `cancelled` (admin action or intake API cancel)

### Assignment Rules
- Driver+Vehicle: set `driver_id` + `vehicle_id`, clear `partner_id` + `partner_assignment_price`
- Partner: set `partner_id` + `partner_assignment_price`, clear `driver_id` + `vehicle_id`
- Either assignment moves status `pending → confirmed`

### Intake API
- Identified by: `provider_email` field → lookup in `provider_emails` table
- Authenticated by: `Authorization: Bearer <INTAKE_API_KEY>` header
- CREATE → always produces `pending` booking
- UPDATE on `confirmed` before pickup → `pending` + clear assignment
- UPDATE on `confirmed` after pickup → reject 409
- DELETE → sets status to `cancelled`
- Round-trips split into two bookings by the external parser, linked via `linked_booking_id`

### Security
- No route in `(dashboard)` group is accessible without a valid `tt_session` cookie
- Middleware enforces this — do not bypass it
- No self-registration endpoint exists or should exist
- Passwords stored as bcrypt hashes — never plaintext

## Language Laws
- All user-facing text in the UI: **Greek**
- All PDF content: **Greek**
- All code, API contracts, DB columns, comments: **English**

## Financial Laws
- `difference` = `real_price - declared_price` — computed on the fly, never stored
- Booking list totals always react to the active filter state
- `declared_price` is optional at confirmation; becomes locked at completion

## Custom Fields Law
- Definitions live in `custom_field_definitions` table
- Values live in `custom_fields` JSONB on each entity row
- Deleting a definition hides it from UI — historical JSONB data is NOT deleted

## What Is Out of Scope (Phase A)
- Google Calendar sync (Phase B)
- WhatsApp integration (future)
- Conversational AI (future)
- Multi-role access (single admin only)
- Self-registration or password recovery

## Auto-Completion Cron
- Runs every 30 minutes via Cloudflare Cron Trigger
- Finds all `confirmed` bookings where `pickup_datetime < NOW()`
- Sets status to `completed`, sets `completed_at = NOW()`, logs to `booking_history`
