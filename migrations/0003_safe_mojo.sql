ALTER TABLE "micro_expenses" DROP CONSTRAINT "micro_expenses_driver_id_drivers_id_fk";
--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "provider_booking_ref" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "provider_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "micro_expenses" ALTER COLUMN "driver_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "micro_expenses" ADD CONSTRAINT "micro_expenses_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE set null ON UPDATE no action;