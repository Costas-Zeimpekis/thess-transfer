# API Reference

## Authentication

### Admin session (UI)
All dashboard routes protected via middleware. Session stored in `tt_session` HttpOnly cookie (SameSite=Strict, Secure in production).

```
POST /api/auth/login
Body: { username, password, turnstileToken }
Response: sets tt_session cookie

POST /api/auth/logout
Response: clears tt_session cookie

POST /api/auth/change-password
Body: { currentPassword, newPassword }
```

---

## Intake API (External Email Parser)

All requests require:
```
Authorization: Bearer <INTAKE_API_KEY>
```
Token validated in `src/lib/intake-auth.ts`.

### Create booking
```
POST /api/intake/booking
```
Body:
```json
{
  "provider_email":       "bookings@airportstaxitransfers.com",
  "provider_booking_ref": "ATT-123456",
  "pickup_datetime":      "2026-04-10T14:30:00Z",
  "flight_number":        "A3 601",
  "pickup_location":      "Thessaloniki Airport",
  "dropoff_location":     "Aristotelous Square 1",
  "passenger_count":      3,
  "vehicle_type":         "van",
  "baby_seat":            false,
  "booster_seat":         false,
  "customer_name":        "John Smith",
  "customer_phone":       "+44 7911 123456",
  "customer_email":       "john@example.com",
  "payment_method":       "credit_card",
  "notes":                "Late night arrival",
  "real_price":           45.00,
  "is_return_trip":       false,
  "linked_provider_ref":  null
}
```
All fields except `provider_email`, `provider_booking_ref`, `pickup_datetime`, `pickup_location`, `dropoff_location`, `vehicle_type`, `customer_name` are nullable.

Response: `201 { id, status: "pending" }`

### Update booking
```
PUT /api/intake/booking
```
Body: same structure as POST. `provider_email` + `provider_booking_ref` identify the booking. Only include changed fields (all fields optional except identifiers).

Behavior:
- Status `pending` → updates fields, stays `pending`
- Status `confirmed` + `pickup_datetime > NOW()` → updates fields, reverts to `pending`, clears assignment
- Status `confirmed` + `pickup_datetime <= NOW()` → 409 Conflict
- Status `completed` → 409 Conflict
- Status `cancelled` → 404 Not Found

Response: `200 { id, status }`

### Cancel booking
```
DELETE /api/intake/booking
```
Body:
```json
{
  "provider_email":       "bookings@airportstaxitransfers.com",
  "provider_booking_ref": "ATT-123456"
}
```
Response: `200 { id, status: "cancelled" }`

---

## Internal API (Dashboard)

All routes require valid session cookie.

### Bookings
```
GET    /api/bookings          ?status=&provider=&driver=&vehicle=&partner=&from=&to=&search=
GET    /api/bookings/:id
POST   /api/bookings          (manual create)
PUT    /api/bookings/:id      (edit fields)
POST   /api/bookings/:id/assign   { type: "driver", driverId, vehicleId } | { type: "partner", partnerId, price }
POST   /api/bookings/:id/cancel
GET    /api/bookings/:id/pdf  (returns PDF stream)
```

### Drivers
```
GET    /api/drivers
GET    /api/drivers/:id
POST   /api/drivers
PUT    /api/drivers/:id
DELETE /api/drivers/:id  (soft delete — sets active=false)
```

### Vehicles
```
GET    /api/vehicles
GET    /api/vehicles/:id
POST   /api/vehicles
PUT    /api/vehicles/:id
DELETE /api/vehicles/:id  (soft delete)
```

### Partners
```
GET    /api/partners
GET    /api/partners/:id
POST   /api/partners
PUT    /api/partners/:id
DELETE /api/partners/:id
```

### Providers
```
GET    /api/providers
GET    /api/providers/:id
POST   /api/providers
PUT    /api/providers/:id
DELETE /api/providers/:id
POST   /api/providers/:id/emails          { email, operation }
DELETE /api/providers/:id/emails/:emailId
```

### Micro Expenses
```
GET    /api/micro-expenses    ?driver=&from=&to=
GET    /api/micro-expenses/:id
POST   /api/micro-expenses
PUT    /api/micro-expenses/:id
DELETE /api/micro-expenses/:id
```

### Custom Fields
```
GET    /api/custom-fields?entity=booking
POST   /api/custom-fields     { entityType, name, label, fieldType, options, required, sortOrder }
PUT    /api/custom-fields/:id
DELETE /api/custom-fields/:id
```
