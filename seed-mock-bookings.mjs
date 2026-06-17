/**
 * seed-mock-bookings.mjs
 * Sends 6 fake bookings to the local dev server via /api/agent/booking,
 * simulating what the email-parser microservice does.
 * Usage: node seed-mock-bookings.mjs
 */

const BASE_URL = "http://localhost:3000";
const SECRET =
  "7494b90c4d9d00143da37f8cd12281b3a53f81ef17e3e77e82d8faaa1801163c";
const ENDPOINT = "/api/agent/booking";

const bookings = [
  {
    provider_email: "bookings@airportstaxitransfers.com",
    provider_booking_ref: `MOCK-ATT-${Date.now()}-1`,
    pickup_datetime: "2026-07-10T08:30:00",
    flight_number: "A3 601",
    pickup_location: "Αεροδρόμιο Μακεδονία, Θεσσαλονίκη",
    dropoff_location: "Πλατεία Αριστοτέλους 1, Θεσσαλονίκη",
    passenger_count: 2,
    vehicle_type: "car",
    baby_seat: 0,
    booster_seat: 0,
    customer_name: "James Wilson",
    customer_phone: "+44 7700 900123",
    customer_email: "james.wilson@example.com",
    payment_method: "credit_card",
    notes: "Early morning flight",
    real_price: 38.0,
    is_return_trip: false,
  },
  {
    provider_email: "info@talixo.de",
    provider_booking_ref: `MOCK-TAL-${Date.now()}-2`,
    pickup_datetime: "2026-07-11T14:00:00",
    flight_number: "EZY 8812",
    pickup_location: "Αεροδρόμιο Μακεδονία, Θεσσαλονίκη",
    dropoff_location: "Ξενοδοχείο Electra Palace, Θεσσαλονίκη",
    passenger_count: 4,
    vehicle_type: "van",
    baby_seat: 1,
    booster_seat: 0,
    customer_name: "Sophie Müller",
    customer_phone: "+49 151 23456789",
    customer_email: "sophie.mueller@example.de",
    payment_method: "paypal",
    notes: null,
    real_price: 55.0,
    is_return_trip: false,
  },
  {
    provider_email: "reservations@ziptransfers.com",
    provider_booking_ref: `MOCK-ZIP-${Date.now()}-3`,
    pickup_datetime: "2026-07-12T20:15:00",
    flight_number: "FR 4422",
    pickup_location: "Αεροδρόμιο Μακεδονία, Θεσσαλονίκη",
    dropoff_location: "Χαλκιδική, Κασσάνδρα",
    passenger_count: 6,
    vehicle_type: "van",
    baby_seat: 0,
    booster_seat: 1,
    customer_name: "Maria Rossi",
    customer_phone: "+39 333 1234567",
    customer_email: "maria.rossi@example.it",
    payment_method: "cash",
    notes: "Extra luggage",
    real_price: 90.0,
    is_return_trip: false,
  },
  {
    provider_email: "bookings@cheap-taxis.com",
    provider_booking_ref: `MOCK-CT-${Date.now()}-4`,
    pickup_datetime: "2026-07-15T10:45:00",
    flight_number: null,
    pickup_location: "Ξενοδοχείο Capsis, Θεσσαλονίκη",
    dropoff_location: "Αεροδρόμιο Μακεδονία, Θεσσαλονίκη",
    passenger_count: 1,
    vehicle_type: "car",
    baby_seat: 0,
    booster_seat: 0,
    customer_name: "David Brown",
    customer_phone: "+1 555 987 6543",
    customer_email: "david.brown@example.com",
    payment_method: "paid",
    notes: null,
    real_price: 32.0,
    is_return_trip: false,
  },
  {
    provider_email: "partnerships@journeetrips.com",
    provider_booking_ref: `MOCK-JRN-${Date.now()}-5`,
    pickup_datetime: "2026-07-18T16:30:00",
    flight_number: "W6 3301",
    pickup_location: "Αεροδρόμιο Μακεδονία, Θεσσαλονίκη",
    dropoff_location: "Χαλκιδική, Σιθωνία",
    passenger_count: 8,
    vehicle_type: "bus",
    baby_seat: 0,
    booster_seat: 0,
    customer_name: "Anna Kowalski",
    customer_phone: "+48 600 123 456",
    customer_email: "anna.kowalski@example.pl",
    payment_method: "bank",
    notes: "Group transfer, 8 pax with large bags",
    real_price: 140.0,
    is_return_trip: false,
  },
  {
    provider_email: "provider-do-not-reply@mozio.com",
    provider_booking_ref: `MOCK-MOZ-${Date.now()}-6`,
    pickup_datetime: "2026-07-20T07:00:00",
    flight_number: "OA 201",
    pickup_location: "Αεροδρόμιο Μακεδονία, Θεσσαλονίκη",
    dropoff_location: "Βέροια, κεντρικό ξενοδοχείο",
    passenger_count: 3,
    vehicle_type: "car",
    baby_seat: 0,
    booster_seat: 0,
    customer_name: "Lucas Petit",
    customer_phone: "+33 6 12 34 56 78",
    customer_email: "lucas.petit@example.fr",
    payment_method: "credit_card",
    notes: null,
    real_price: 62.0,
    is_return_trip: false,
  },
];

async function sign(method, pathname, body) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload = `${timestamp}.${method}.${pathname}.${body}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  const hex = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { timestamp, signature: hex };
}

async function sendBooking(booking, index) {
  const body = JSON.stringify(booking);
  const { timestamp, signature } = await sign("POST", ENDPOINT, body);

  const res = await fetch(`${BASE_URL}${ENDPOINT}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Agent-Timestamp": timestamp,
      "X-Agent-Signature": signature,
    },
    body,
  });

  const data = await res.json();
  if (res.ok) {
    console.log(
      `✓ Booking ${index + 1} created — id: ${data.id} ref: ${booking.provider_booking_ref}`,
    );
  } else {
    console.error(`✗ Booking ${index + 1} failed (${res.status}):`, data);
  }
}

for (let i = 0; i < bookings.length; i++) {
  await sendBooking(bookings[i], i);
}
