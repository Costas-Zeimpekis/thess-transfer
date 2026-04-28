import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { drivers, microExpenses } from "@/lib/db/schema";
import MicroExpensesClient from "@/components/micro-expenses/micro-expenses-client";

export default async function MicroExpensesPage() {
	const [allDrivers, allExpenses] = await Promise.all([
		db
			.select({ id: drivers.id, fullName: drivers.fullName })
			.from(drivers)
			.where(eq(drivers.active, true))
			.orderBy(asc(drivers.fullName)),
		db
			.select({
				id: microExpenses.id,
				driverId: microExpenses.driverId,
				driverName: drivers.fullName,
				bookingId: microExpenses.bookingId,
				reason: microExpenses.reason,
				price: microExpenses.price,
				date: microExpenses.date,
				description: microExpenses.description,
			})
			.from(microExpenses)
			.innerJoin(drivers, eq(drivers.id, microExpenses.driverId))
			.orderBy(desc(microExpenses.date), desc(microExpenses.createdAt)),
	]);

	return (
		<MicroExpensesClient drivers={allDrivers} initialExpenses={allExpenses} />
	);
}
