CREATE TABLE "calendar_backups" (
	"id" serial PRIMARY KEY NOT NULL,
	"calendar_id" varchar(200) NOT NULL,
	"events_count" integer DEFAULT 0 NOT NULL,
	"ics_content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
