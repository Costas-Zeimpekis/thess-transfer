# Database Schema

Database: Neon PostgreSQL. ORM: Drizzle. Schema file: `src/lib/db/schema.ts`.

## Enums

| Enum | Values |
|---|---|
| `booking_status` | `pending`, `confirmed`, `completed`, `cancelled` |
| `booking_source` | `automatic`, `manual` |
| `vehicle_type` | `car`, `van`, `bus` |
| `payment_method` | `cash`, `paypal`, `credit_card`, `bank`, `paid` |
| `provider_email_operation` | `all`, `booking`, `modification`, `cancellation` |
| `custom_field_type` | `text`, `number`, `boolean`, `date`, `select` |
| `custom_field_entity` | `booking`, `driver`, `vehicle`, `partner`, `micro_expense` |

## Tables

### `users`
Admin users. No self-registration — added manually.
```
id, username (unique), password_hash, created_at, updated_at
```

### `sessions`
Auth sessions. Token stored in HttpOnly cookie.
```
id (uuid), user_id → users, expires_at, created_at
```

### `providers`
Transfer provider companies (Talixo, Mozio, etc.).
```
id, name, slug (unique), created_at, updated_at
```

### `provider_emails`
Each provider can have multiple emails, each for a specific operation type.
Talixo has 2: one for bookings, one for modifications/cancellations.
```
id, provider_id → providers, email (unique), operation (enum), created_at
```

### `drivers`
Internal drivers.
```
id, full_name, id_card, phone, email, google_calendar_id (Phase B),
active, custom_fields (jsonb), created_at, updated_at
```

### `vehicles`
```
id, name, plate (unique), type (enum), brand,
active, custom_fields (jsonb), created_at, updated_at
```

### `partners`
External partner companies bookings can be outsourced to.
```
id, name, email, phone, contact_info,
custom_fields (jsonb), created_at, updated_at
```

### `bookings`
Core table.
```
id (serial, our system ID)
provider_booking_ref         -- provider's reference number
provider_id → providers
status (enum)                -- pending | confirmed | completed | cancelled
source (enum)                -- automatic | manual

-- Trip
pickup_datetime
flight_number
pickup_location
dropoff_location
passenger_count
vehicle_type (enum)          -- requested type
baby_seat (bool)
booster_seat (bool)

-- Customer
customer_name
customer_phone
customer_email

-- Financials
payment_method (enum)
notes (text)
real_price                   -- set by parser / admin, from provider
declared_price               -- set by admin manually; LOCKED once completed

-- Assignment (partner OR driver+vehicle, not both)
driver_id → drivers (nullable)
vehicle_id → vehicles (nullable)
partner_id → partners (nullable)
partner_assignment_price (nullable)

-- Return trip
linked_booking_id → bookings (self-ref, nullable)
is_return_trip (bool)

-- Phase B
google_calendar_event_id (nullable)

custom_fields (jsonb)
completed_at
created_at, updated_at

UNIQUE(provider_booking_ref, provider_id)
```

### `booking_history`
Audit log for every state change.
```
id, booking_id → bookings, action (varchar),
source (enum), changed_by → users (nullable — null = automatic),
changes (jsonb), created_at
```

Action values: `created`, `updated`, `confirmed`, `cancelled`, `completed`,
`assigned_driver`, `assigned_partner`, `unassigned`, `reverted_to_pending`

### `micro_expenses`
Small operational expenses linked to a driver and optionally a booking.
```
id, driver_id → drivers (nullable, set null on delete), booking_id → bookings (nullable, set null on delete),
reason, price, date, description,
custom_fields (jsonb), created_at, updated_at
```

### `custom_field_definitions`
Admin-configurable extra fields per entity type. Values stored in `custom_fields` JSONB column on each entity.
```
id, entity_type (enum), name (internal key), label (display),
field_type (enum), options (jsonb — for select type),
required (bool), active (bool), sort_order, created_at
```

## Indexes
```sql
bookings: status, pickup_datetime, provider_id, driver_id, vehicle_id, partner_id
booking_history: booking_id
micro_expenses: driver_id, date
sessions: user_id, expires_at
```
