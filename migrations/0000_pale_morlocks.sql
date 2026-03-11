CREATE TYPE "public"."booking_source" AS ENUM('automatic', 'manual');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."custom_field_entity" AS ENUM('booking', 'driver', 'vehicle', 'partner', 'micro_expense');--> statement-breakpoint
CREATE TYPE "public"."custom_field_type" AS ENUM('text', 'number', 'boolean', 'date', 'select');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'paypal', 'credit_card', 'bank', 'paid');--> statement-breakpoint
CREATE TYPE "public"."provider_email_operation" AS ENUM('all', 'booking', 'modification', 'cancellation');--> statement-breakpoint
CREATE TYPE "public"."vehicle_type" AS ENUM('car', 'van', 'bus');--> statement-breakpoint
CREATE TABLE "booking_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"action" varchar(100) NOT NULL,
	"source" "booking_source" NOT NULL,
	"changed_by" integer,
	"changes" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_booking_ref" varchar(200) NOT NULL,
	"provider_id" integer NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"source" "booking_source" DEFAULT 'automatic' NOT NULL,
	"pickup_datetime" timestamp with time zone NOT NULL,
	"flight_number" varchar(50),
	"pickup_location" text NOT NULL,
	"dropoff_location" text NOT NULL,
	"passenger_count" integer DEFAULT 1 NOT NULL,
	"vehicle_type" "vehicle_type" NOT NULL,
	"baby_seat" boolean DEFAULT false,
	"booster_seat" boolean DEFAULT false,
	"customer_name" varchar(200) NOT NULL,
	"customer_phone" varchar(50),
	"customer_email" varchar(200),
	"payment_method" "payment_method",
	"notes" text,
	"real_price" numeric(10, 2),
	"declared_price" numeric(10, 2),
	"driver_id" integer,
	"vehicle_id" integer,
	"partner_id" integer,
	"partner_assignment_price" numeric(10, 2),
	"linked_booking_id" integer,
	"is_return_trip" boolean DEFAULT false,
	"google_calendar_event_id" varchar(200),
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "bookings_provider_booking_ref_provider_id_unique" UNIQUE("provider_booking_ref","provider_id")
);
--> statement-breakpoint
CREATE TABLE "custom_field_definitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" "custom_field_entity" NOT NULL,
	"name" varchar(100) NOT NULL,
	"label" varchar(200) NOT NULL,
	"field_type" "custom_field_type" DEFAULT 'text' NOT NULL,
	"options" jsonb,
	"required" boolean DEFAULT false,
	"active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(200) NOT NULL,
	"id_card" varchar(50),
	"phone" varchar(50),
	"email" varchar(200),
	"google_calendar_id" varchar(200),
	"active" boolean DEFAULT true,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "micro_expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"driver_id" integer NOT NULL,
	"reason" varchar(200) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"date" date NOT NULL,
	"description" text,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"email" varchar(200),
	"phone" varchar(50),
	"contact_info" text,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "provider_emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" integer NOT NULL,
	"email" varchar(200) NOT NULL,
	"operation" "provider_email_operation" DEFAULT 'all' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "provider_emails_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "providers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"plate" varchar(50) NOT NULL,
	"type" "vehicle_type" NOT NULL,
	"brand" varchar(100),
	"active" boolean DEFAULT true,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "vehicles_plate_unique" UNIQUE("plate")
);
--> statement-breakpoint
ALTER TABLE "booking_history" ADD CONSTRAINT "booking_history_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_history" ADD CONSTRAINT "booking_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "micro_expenses" ADD CONSTRAINT "micro_expenses_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_emails" ADD CONSTRAINT "provider_emails_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;