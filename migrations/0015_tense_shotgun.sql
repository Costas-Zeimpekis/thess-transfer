CREATE TYPE "public"."user_role" AS ENUM('admin', 'developer');--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "approved" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'admin' NOT NULL;