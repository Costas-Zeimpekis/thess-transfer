# Business Logic

## Booking Status Flow

```
[Intake API CREATE]  ──────────────────────────────────► pending
[Manual CREATE]      ──────────────────────────────────► pending

pending ──► [admin confirms manually OR assigns driver+vehicle OR partner] ──► confirmed
confirmed ──► [pickup_datetime passes — auto cron]    ──► completed
confirmed ──► [intake API UPDATE before pickup time]  ──► pending  (assignment cleared)
any non-completed ──► [intake API CANCEL or manual]   ──► cancelled
```

### Rules
- `completed` bookings: `declared_price` is locked (cannot be edited)
- `completed` bookings: cannot be cancelled
- Intake API UPDATE on `completed` booking → rejected (returns 409)
- Intake API UPDATE on `confirmed` booking where `pickup_datetime > NOW()` → reverts to `pending`, clears `driver_id`, `vehicle_id`, `partner_id`, `partner_assignment_price`, logs to history
- Auto-completion runs via Cloudflare Cron Trigger every 30 minutes

### Encoding failures (intake / agent API)
Upstream email parsers can deliver text with control characters (a NUL byte cannot be stored in a
PostgreSQL `text` column at all — SQLSTATE `22021`). Rather than losing the whole booking:

- On **create**: fields containing control characters are **not stored** — `NOT NULL` columns get
  `""`, nullable ones `null`. Everything else on the booking is saved normally and the booking is
  created as usual (`pending`, `approved: true`, visible to admins)
- On **update**: a corrupted value never overwrites what is already stored — the existing value is
  kept and the field is flagged instead
- The raw value received is preserved in `custom_fields.encodingIssues` so an operator can
  reconstruct the original from the booking detail page
- A `warn` entry is written to `system_logs`, surfacing in Ειδοποιήσεις
- Checked fields: `provider_booking_ref`, `updated_provider_booking_ref`, `pickup_location`,
  `dropoff_location`, `customer_name`, `customer_phone`, `customer_email`, `flight_number`, `notes`.
  Tabs and newlines are allowed (legitimate in free text)
- Helpers live in `src/lib/encoding.ts`

### Required fields before a status change
`pickup_location`, `dropoff_location` and `customer_name` must be non-blank before a booking may
move to `confirmed`, `assigned` or `completed`. This is what holds a booking with dropped fields
until someone fills them in.

- Shared helper: `validateRequiredBookingFields()` in `src/lib/utils.ts`, returns a Greek error (400)
- Enforced on every path that can advance status: `PATCH /api/bookings/[id]`, the auto-transition to
  `confirmed` inside `PUT /api/bookings/[id]`, and `POST /api/bookings/[id]/assign`
- Mirrored client-side by the existing booking form validation
- Transitions to `pending`/`cancelled` are not blocked

### Date validation
- `end_time` (Ημερομηνία Λήξης) must be strictly after both `arrival_datetime` (Ημερομηνία Άφιξης) and `start_time` (Ημερομηνία Έναρξης)
- A blank `start_time` is ignored; a blank `end_time` skips validation entirely
- Enforced on every internal booking mutation: create (`POST /api/bookings`), update (`PUT /api/bookings/[id]`), forward status change to `confirmed`/`assigned`/`completed` (`PATCH /api/bookings/[id]`), and driver/partner assignment (`POST /api/bookings/[id]/assign`). Transitions to `pending`/`cancelled` are not blocked
- Shared helper: `validateBookingDates()` in `src/lib/utils.ts`; also mirrored client-side in the booking form. Returns a Greek error message on failure (400)

### Google Calendar sync
Two independent calendar events per booking, all logic in `src/lib/google-calendar.ts`:

- **Main company calendar** (`raptis79@gmail.com`, hardcoded as `MAIN_CALENDAR_ID`): event created the moment a booking becomes `confirmed` (regardless of assignment), stored in `google_calendar_main_event_id`. Updated on every subsequent update / status change, cancelled when the booking is cancelled.
- **Driver calendar** (`drivers.google_calendar_id`): a second event created only once a driver is assigned, stored in `google_calendar_event_id`. Updated on every update, cancelled when the driver is removed or the booking is cancelled.
- `syncBookingCalendars()` — syncs both (main when confirmed+, driver when a driver is present). Called from `PUT` (on any change), `PATCH` (non-cancel transitions), and the `assign` route (driver assignment).
- `syncMainCalendarEvent()` — main event only; called by the `assign` route on partner / unassign to refresh the main event while the driver event is removed.
- `markDriverCalendarEventCancelled()` — cancels only the driver event (driver removed, booking stays active).
- `markBookingCalendarEventCancelled()` — cancels **both** events (whole booking cancelled: cancel button, internal PATCH, intake PATCH).
- Cancellation keeps the event visible, prepends `❌ ΑΚΥΡΩΘΗΚΕ — ` to its title and greys it out (Graphite / colorId 8) — Google Calendar has no strikethrough. No-op per calendar when no event exists.
- History actions: `main_calendar_event_created` / `_failed` / `_cancelled` / `_cancel_failed` for the main calendar; `calendar_event_created` / `_failed` / `_cancelled` / `_cancel_failed` for the driver calendar.
- **Prerequisite:** the service account (`GOOGLE_CALENDAR_CLIENT_EMAIL`) must be granted write access to `raptis79@gmail.com`, otherwise main-calendar writes fail (logged as `main_calendar_event_failed`).

## Assignment Logic

### Assign to driver + vehicle
- Set `driver_id` and `vehicle_id`
- Clear `partner_id` and `partner_assignment_price`
- Status: pending → confirmed (auto)

### Assign to partner
- Set `partner_id` and `partner_assignment_price`
- Clear `driver_id` and `vehicle_id`
- Status: pending → confirmed (auto)
- The booking will NOT appear in driver or vehicle filtered lists

### Reassignment
- Can switch from partner → driver+vehicle and vice versa at any time (while not completed)
- Clearing an assignment from a confirmed booking does NOT revert status to pending

### Manual confirmation
- Admin can confirm a booking without assigning a driver or partner
- Assignment can be added later while status remains confirmed

## Financial Calculations

### Per booking
- `real_price`: set by intake API or manually by admin
- `declared_price`: set manually by admin (optional at confirmation, locked at completion)
- `difference`: `real_price - declared_price` (computed, not stored)

### Booking list totals (always shown, react to active filters)
- Sum of `real_price` for visible rows
- Sum of `declared_price` for visible rows
- Sum of differences (`real_price - declared_price`) for visible rows

## Providers & Email Identification

The intake API identifies the provider by the sender email (`provider_email` field in request body). We look up `provider_emails.email` to find the provider.

Talixo special case:
- `info@talixo.de` → operation = `booking`
- `do-not-reply@talixo.de` → operation = `modification` / `cancellation`

## Round Trips

Some providers send a single email containing both outbound and return legs. The external email parser is responsible for splitting them and sending two separate CREATE requests. We link them via `linked_booking_id` (bidirectional self-reference).

## Micro-Expenses

- Standalone list, not linked to bookings
- Linked to a driver
- Fields: `reason`, `price`, `date`, `description`
- List filters: by driver, by date range (from expense `date`)
- Totals shown for current filter

## Custom Fields

- Admin can add/remove fields per entity type via Settings
- Definitions stored in `custom_field_definitions`
- Values stored in `custom_fields` JSONB column on each entity
- Removing a field hides it from UI but preserves historical JSONB data
- Field types: text, number, boolean, date, select (with configurable options)
