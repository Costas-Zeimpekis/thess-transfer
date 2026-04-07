import { asc, eq } from "drizzle-orm";
import BookingForm from "@/components/bookings/booking-form";
import { db } from "@/lib/db";
import { drivers, partners, providers, vehicles } from "@/lib/db/schema";

export default async function NewBookingPage() {
	const [allProviders, allDrivers, allVehicles, allPartners] =
		await Promise.all([
			db
				.select({ id: providers.id, name: providers.name })
				.from(providers)
				.orderBy(asc(providers.name)),
			db
				.select({ id: drivers.id, fullName: drivers.fullName })
				.from(drivers)
				.where(eq(drivers.active, true))
				.orderBy(asc(drivers.fullName)),
			db
				.select({ id: vehicles.id, name: vehicles.name, plate: vehicles.plate })
				.from(vehicles)
				.where(eq(vehicles.active, true))
				.orderBy(asc(vehicles.name)),
			db
				.select({ id: partners.id, name: partners.name })
				.from(partners)
				.orderBy(asc(partners.name)),
		]);

	return (
		<BookingForm
			providers={allProviders}
			drivers={allDrivers}
			vehicles={allVehicles}
			partners={allPartners}
			history={[]}
			microExpenses={[]}
		/>
	);
}
