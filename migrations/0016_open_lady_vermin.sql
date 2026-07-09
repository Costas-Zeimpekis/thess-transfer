ALTER TABLE "bookings" ALTER COLUMN "start_time" SET DATA TYPE timestamp with time zone USING CASE
	WHEN "start_time" IS NULL OR "start_time" = '' THEN NULL
	ELSE ((("arrival_datetime" AT TIME ZONE 'Europe/Athens')::date + "start_time"::time) AT TIME ZONE 'Europe/Athens')
END;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "end_time" SET DATA TYPE timestamp with time zone USING CASE
	WHEN "end_time" IS NULL OR "end_time" = '' THEN NULL
	ELSE ((("arrival_datetime" AT TIME ZONE 'Europe/Athens')::date + "end_time"::time) AT TIME ZONE 'Europe/Athens')
END;
