# UI Specification

Language: Greek throughout.
Framework: Next.js 14 App Router. Styling: Tailwind CSS + shadcn/ui.

## Layout

### Unauthenticated
- `/login` — full-page login form (username, password, Cloudflare Turnstile)
- Redirect to `/bookings` on success

### Authenticated — Dashboard Shell
- Persistent sidebar (shadcn Sidebar component)
- Top bar with user info + logout + change password
- Main content area

#### Sidebar links
- Κρατήσεις (Bookings)
- Οδηγοί (Drivers)
- Οχήματα (Vehicles)
- Συνεργάτες (Partners)
- Πάροχοι (Providers)
- Μικροέξοδα (Micro Expenses)
- Ρυθμίσεις (Settings — custom fields)

---

## Pages

### `/bookings` — Booking List

**Filters (top bar):**
- Date range (pickup_datetime)
- Status (pending / confirmed / completed / cancelled)
- Payment method (cash / paypal / credit_card / bank / paid)
- Provider
- Driver
- Vehicle
- Partner
- Search (customer name, provider ref)

**Table columns:**
- System ID
- Provider ref
- Provider
- Pickup date/time
- Route (pickup → dropoff)
- Customer name
- Vehicle type
- Driver / Vehicle (or Partner name)
- Status badge
- Ημ/νία Κράτησης (createdAt — full datetime, sortable)
- Payment method (Τρόπος Πληρωμής)
- Real price
- Declared price
- Difference
- Actions (view, edit, PDF)

**Footer totals (always visible, react to filters):**
- Σύνολο Πραγματικής Τιμής: €X
- Σύνολο Δηλωθείσας Τιμής: €X
- Σύνολο Διαφοράς: €X

**Actions:**
- "Νέα Κράτηση" button → `/bookings/new`
- Row click → `/bookings/[id]`

---

### `/bookings/new` — New Booking (Manual)
Form with all booking fields. Source = `manual`. Status starts as `pending`.

---

### `/bookings/[id]` — Booking Detail

**Sections:**
1. **Στοιχεία Κράτησης** — all booking fields (editable if not completed)
2. **Ανάθεση** — assign to driver+vehicle OR partner (radio toggle)
   - Driver+Vehicle: driver select, vehicle select → confirms booking
   - Partner: partner select, assignment price → confirms booking
   - Button to unassign / reassign
3. **Οικονομικά** — real price (editable), declared price (editable until completed), difference (computed)
4. **Ιστορικό** — chronological list of all booking_history entries
5. **Ενέργειες** — Cancel booking, Print PDF

---

### `/drivers` — Driver List
Table: name, phone, email, active status, actions (edit, deactivate).
"Νέος Οδηγός" button → inline sheet or `/drivers/new`.

### `/drivers/[id]` — Driver Detail
Edit form + list of their bookings + list of their micro expenses.

---

### `/vehicles` — Vehicle List
Table: name, plate, type, brand, active. Actions: edit, deactivate.

### `/vehicles/[id]` — Vehicle Detail
Edit form + list of assigned bookings.

---

### `/partners` — Partner List
Table: name, email, phone. Actions: edit, delete.

### `/partners/[id]` — Partner Detail
Edit form + list of bookings assigned to this partner.

---

### `/providers` — Provider List
Table: name, slug, emails. Actions: edit, add/remove emails.

---

### `/micro-expenses` — Micro Expense List

**Filters:** driver, date range
**Table:** date, driver, reason, amount, description
**Footer total:** Σύνολο: €X
**Actions:** add, edit, delete

---

### `/settings` — Custom Fields
Per entity type tab (Booking, Driver, Vehicle, Partner, Micro Expense).
Each tab shows a list of defined fields with drag-to-reorder, edit, toggle active, delete.
"Προσθήκη Πεδίου" → dialog with: label, internal name, type, options (if select), required toggle.

---

## PDF Movement Sheet (per booking)

Generated server-side, Greek text, rendered with `@react-pdf/renderer`.

Contents:
- Company header
- Αρ. Κράτησης (system ID)
- Ημερομηνία & Ώρα Παραλαβής
- Οδηγός
- Όχημα
- Διαδρομή: Παραλαβή → Αποστολή
- Αρ. Πτήσης
- Επιβάτης
- Τηλέφωνο
- Αρ. Επιβατών
- Baby seat / Booster seat
- Σημειώσεις
