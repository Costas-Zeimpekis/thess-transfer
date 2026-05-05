ALTER TABLE "bookings" ALTER COLUMN "baby_seat" DROP DEFAULT;
ALTER TABLE "bookings" ALTER COLUMN "baby_seat" SET DATA TYPE integer USING baby_seat::integer;
ALTER TABLE "bookings" ALTER COLUMN "baby_seat" SET DEFAULT 0;