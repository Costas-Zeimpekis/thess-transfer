# Thess Transfers — AI Email Agent Integration Guide (n8n)

This document describes how to connect an n8n workflow to the Thess Transfers booking system. The workflow reads incoming booking emails, extracts data using an AI model, and calls the API to create, update, or cancel bookings.

---

## Base URL

```
https://thess-transfer.vercel.app
```

---

## Authentication — HMAC-SHA256

Every request must be signed. There is no login — each HTTP request is self-authenticating using a shared secret.

### How it works

Before each request, compute a signature over:

```
payload = timestamp + "." + METHOD + "." + path + "." + body
```

- `timestamp` — current Unix time in **seconds** (integer, as string)
- `METHOD` — uppercase HTTP method (`POST`, `PUT`, `PATCH`)
- `path` — the URL path, e.g. `/api/agent/booking`
- `body` — the JSON body **exactly as it will be sent**, or `""` for no body

Send two extra headers with every request:

```
X-Agent-Timestamp: <unix seconds>
X-Agent-Signature: <HMAC-SHA256 hex string>
```

> Requests older than 5 minutes are rejected — always generate a fresh timestamp immediately before sending.

---

## Signing in n8n — Code Node

Place a **Code node** (JavaScript) before every HTTP Request node. It computes the timestamp and signature and passes them forward.

```javascript
const crypto = require('crypto');

const secret = $env.AI_AGENT_SECRET;
const method = "POST"; // change to PUT or PATCH as needed
const path   = "/api/agent/booking";
const body   = JSON.stringify($input.first().json.bookingData);

const timestamp = Math.floor(Date.now() / 1000).toString();
const payload   = `${timestamp}.${method}.${path}.${body}`;
const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

return [{
  json: {
    ...$input.first().json,
    _timestamp: timestamp,
    _signature:  signature,
    _body:       body,
  }
}];
```

Then in the **HTTP Request node** that follows, add these headers using expressions:

| Header | Value |
|---|---|
| `X-Agent-Timestamp` | `{{ $json._timestamp }}` |
| `X-Agent-Signature` | `{{ $json._signature }}` |
| `Content-Type` | `application/json` |

And set the body to: `{{ $json._body }}`

---

## Secret key setup in n8n

Store the secret as an **n8n environment variable** — never hardcode it in a node.

1. Go to **Settings → Environment Variables**
2. Add: `AI_AGENT_SECRET` = *(value provided separately)*

Access it in Code nodes with `$env.AI_AGENT_SECRET`.

---

## Endpoints

All three operations use the same URL path: `/api/agent/booking`

---

### POST — Create a booking

Triggered when a new booking email arrives.

**Method:** `POST`  
**URL:** `https://thess-transfer.vercel.app/api/agent/booking`

**Body fields:**

```json
{
  "pickup_datetime":      "2026-05-15T10:00:00Z",
  "pickup_location":      "Thessaloniki Airport",
  "dropoff_location":     "Aristotelous Square 1",
  "vehicle_type":         "car",
  "customer_name":        "John Doe",
  "customer_phone":       "+30 6912345678",
  "customer_email":       "john@example.com",
  "passenger_count":      2,
  "flight_number":        "A3 601",
  "payment_method":       "cash",
  "real_price":           45.00,
  "notes":                "Late night arrival",
  "provider_email":       "bookings@provider.com",
  "provider_booking_ref": "REF-123456",
  "is_return_trip":       false
}
```

**Required:** `pickup_datetime`, `pickup_location`, `dropoff_location`, `vehicle_type`, `customer_name`  
**Everything else is optional.**

**Response:** `201` — full booking object.

> Save the `id` from the response. You will need it for updates and cancellations.

---

### PUT — Update a booking

Triggered when a modification email arrives for an existing booking.

**Method:** `PUT`  
**URL:** `https://thess-transfer.vercel.app/api/agent/booking`

Send `id` plus only the fields that changed:

```json
{
  "id":              27,
  "pickup_datetime": "2026-05-15T11:00:00Z",
  "notes":           "Flight delayed by 1 hour"
}
```

**Rules:**
- Confirmed bookings with a future pickup will automatically revert to `pending` and clear the assignment
- Completed or cancelled bookings return `409` — do not attempt to update them

**Response:** `200` — full updated booking object

---

### PATCH — Change status

Triggered when a cancellation email arrives, or when the agent determines a status change is needed.

**Method:** `PATCH`  
**URL:** `https://thess-transfer.vercel.app/api/agent/booking`

```json
{
  "id":     27,
  "status": "cancelled"
}
```

**Allowed transitions:**

| Current | Can move to |
|---|---|
| `pending` | `confirmed`, `cancelled` |
| `confirmed` | `pending`, `completed`, `cancelled` |
| `completed` | — |
| `cancelled` | — |

**Response:** `200` — full updated booking object

---

## Enum reference

| Field | Allowed values |
|---|---|
| `vehicle_type` | `car`, `van`, `bus` |
| `payment_method` | `cash`, `paypal`, `credit_card`, `bank`, `paid` |
| `status` | `pending`, `confirmed`, `completed`, `cancelled` |

> All datetime fields must be **ISO 8601 UTC**: `2026-05-15T10:00:00Z`

---

## What the AI model should extract from each email

Give this list to the AI node as extraction instructions:

| Field | What to look for |
|---|---|
| `customer_name` | Passenger / traveller full name |
| `pickup_datetime` | Date and time of pickup — convert to UTC ISO 8601 |
| `pickup_location` | Origin / from address |
| `dropoff_location` | Destination / to address |
| `vehicle_type` | Type of vehicle (`car`, `van`, or `bus`) |
| `passenger_count` | Number of passengers |
| `flight_number` | Flight code if it's an airport transfer |
| `payment_method` | How the trip is paid |
| `real_price` | Price stated in the email (number) |
| `provider_email` | The sender's email address |
| `provider_booking_ref` | The provider's own booking reference |
| `notes` | Any special requests or remarks |
| `is_return_trip` | `true` if this is a return leg |

---

## Suggested n8n workflow structure

```
[Email Trigger]
      ↓
[AI Node — extract booking fields from email body]
      ↓
[Code Node — build body JSON, compute HMAC signature]
      ↓
[HTTP Request Node — POST /api/agent/booking]
      ↓
[Code Node — store returned booking id]
      ↓
[Error Handler — catch 4xx/5xx and alert]
```

For modifications and cancellations:

```
[Email Trigger]
      ↓
[AI Node — detect intent: new / update / cancel + extract fields]
      ↓
[Switch Node — route by intent]
      ├── new      → [Code + HTTP POST]
      ├── update   → [Code + HTTP PUT]
      └── cancel   → [Code + HTTP PATCH { status: "cancelled" }]
```

---

## Error responses

| HTTP code | Meaning |
|---|---|
| `400` | Missing required fields or invalid status transition |
| `401` | Invalid or expired signature — check secret and timestamp |
| `404` | Booking not found |
| `409` | Booking is completed or cancelled — cannot be modified |

---

## What you will receive alongside this document

- Postman collection (`.json`) — import and test each endpoint before building the workflow
- `AI_AGENT_SECRET` — shared via a secure channel, add it to n8n environment variables
