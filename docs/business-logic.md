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
- Cancelling a booking (cancel button, internal PATCH, or intake PATCH) marks the linked Google Calendar event as cancelled by keeping it visible, prepending `❌ ΑΚΥΡΩΘΗΚΕ — ` to its title and greying it out (Graphite / colorId 8). Google Calendar has no strikethrough. No-op when the booking has no driver / driver calendar / linked event. Logged as `calendar_event_cancelled` (or `calendar_event_cancel_failed`) in history.

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
