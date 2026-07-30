// Control characters that PostgreSQL text columns cannot store (0x00) or that
// only ever appear when an upstream parser mangled the character encoding.
// Tabs and newlines are legitimate in free-text fields, so they are allowed.
const CONTROL_CHARS_SOURCE = "[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F-\\u009F]";

export const INTAKE_TEXT_FIELDS = [
  "provider_booking_ref",
  "updated_provider_booking_ref",
  "pickup_location",
  "dropoff_location",
  "customer_name",
  "customer_phone",
  "customer_email",
  "flight_number",
  "notes",
] as const;

export type IntakeTextField = (typeof INTAKE_TEXT_FIELDS)[number];

export type EncodingIssue = {
  received: string;
  stripped: string;
};

export type EncodingIssues = Partial<Record<IntakeTextField, EncodingIssue>>;

export function hasBadEncoding(value: unknown): boolean {
  return (
    typeof value === "string" && new RegExp(CONTROL_CHARS_SOURCE).test(value)
  );
}

export function stripControlChars(value: string): string {
  return value
    .replace(new RegExp(CONTROL_CHARS_SOURCE, "g"), "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

// Scans the intake payload for fields whose text arrived corrupted. Those fields
// are not stored — an operator fills them in from the booking detail page — but
// what we received is kept so they can reconstruct the original.
export function detectEncodingIssues(body: unknown): EncodingIssues {
  const issues: EncodingIssues = {};
  if (typeof body !== "object" || body === null) return issues;
  const record = body as Record<string, unknown>;

  for (const field of INTAKE_TEXT_FIELDS) {
    const value = record[field];
    if (!hasBadEncoding(value)) continue;
    issues[field] = {
      received: JSON.stringify(value).slice(1, -1),
      stripped: stripControlChars(value as string),
    };
  }

  return issues;
}

export function hasEncodingIssues(issues: EncodingIssues): boolean {
  return Object.keys(issues).length > 0;
}

// Reads the flags back off a booking row's custom_fields.
export function readEncodingIssues(customFields: unknown): EncodingIssues {
  if (typeof customFields !== "object" || customFields === null) return {};
  const stored = (customFields as Record<string, unknown>).encodingIssues;
  if (typeof stored !== "object" || stored === null) return {};
  return stored as EncodingIssues;
}

export const ENCODING_ISSUE_LABELS: Record<string, string> = {
  provider_booking_ref: "Ref Παρόχου",
  updated_provider_booking_ref: "Νέο Ref Παρόχου",
  pickup_location: "Τόπος Παραλαβής",
  dropoff_location: "Τόπος Αποστολής",
  customer_name: "Ονοματεπώνυμο",
  customer_phone: "Τηλέφωνο",
  customer_email: "Email",
  flight_number: "Αριθμός Πτήσης",
  notes: "Σημειώσεις",
};
