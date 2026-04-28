import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { drivers, microExpenses } from "@/lib/db/schema";

export async function GET() {
	try {
		await requireAuth();
	} catch {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const rows = await db
		.select({
			id: microExpenses.id,
			driverId: microExpenses.driverId,
			driverName: drivers.fullName,
			bookingId: microExpenses.bookingId,
			reason: microExpenses.reason,
			price: microExpenses.price,
			date: microExpenses.date,
			description: microExpenses.description,
			createdAt: microExpenses.createdAt,
		})
		.from(microExpenses)
		.leftJoin(drivers, eq(drivers.id, microExpenses.driverId))
		.orderBy(desc(microExpenses.date), desc(microExpenses.createdAt));

	return NextResponse.json(rows);
}

export async function POST(request: Request) {
	try {
		await requireAuth();
	} catch {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await request.json();
	const { booking_id, driver_id, reason, price, date, description } = body;

	if (!reason || !price || !date) {
		return NextResponse.json(
			{ error: "Λείπουν υποχρεωτικά πεδία" },
			{ status: 400 },
		);
	}

	const [row] = await db
		.insert(microExpenses)
		.values({
			bookingId: booking_id ?? null,
			driverId: driver_id ?? null,
			reason,
			price: String(price),
			date,
			description: description || null,
		})
		.returning();

	return NextResponse.json(row, { status: 201 });
}
