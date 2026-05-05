ALTER TABLE "bookings" ALTER COLUMN "booster_seat" DROP DEFAULT;
ALTER TABLE "bookings" ALTER COLUMN "booster_seat" SET DATA TYPE integer USING booster_seat::integer;
ALTER TABLE "bookings" ALTER COLUMN "booster_seat" SET DEFAULT 0;
