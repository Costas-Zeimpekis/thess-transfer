ALTER TABLE "bookings" ALTER COLUMN "provider_booking_ref" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "provider_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_provider_booking_ref_provider_id_unique";
