# Providers

All 9 providers pre-seeded via `pnpm db:seed`.

| Provider | Slug | Email(s) | Operation |
|---|---|---|---|
| Airports Taxi Transfers | `airports-taxi-transfers` | bookings@airportstaxitransfers.com | all |
| Foxtransfer EU | `foxtransfer-eu` | info@foxtransfer.eu | all |
| Cheap-Taxis | `cheap-taxis` | bookings@cheap-taxis.com | all |
| Talixo | `talixo` | info@talixo.de | booking |
| Talixo | `talixo` | do-not-reply@talixo.de | modification/cancellation |
| ZIPTRANSFERS | `ziptransfers` | reservations@ziptransfers.com | all |
| JOURNEE | `journee` | partnerships@journeetrips.com | all |
| ShuttleDirect | `shuttledirect` | blackhole@shuttledirect.com | all |
| Mozio | `mozio` | provider-do-not-reply@mozio.com | all |
| Transfers Thessaloniki | `transfers-thessaloniki` | info@transfersthessaloniki.com | all |

## How provider identification works (Intake API)

The external email parser sends `provider_email` in the request body.
We look up `provider_emails.email` to find the matching provider.
This means each email address is unique across all providers.

## Adding a new provider

1. Via admin panel → Πάροχοι → Νέος Πάροχος
2. Fill name + slug, then add email(s) with operation type
3. Inform the email parser service of the new email address
