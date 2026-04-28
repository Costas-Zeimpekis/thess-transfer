import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { microExpenses } from "@/lib/db/schema";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
	try {
		await requireAuth();
	} catch {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await context.params;
	const expenseId = parseInt(id, 10);
	const body = await request.json();
	const { driver_id, reason, price, date, description } = body;

	if (!reason || !price || !date) {
		return NextResponse.json(
			{ error: "Λείπουν υποχρεωτικά πεδία" },
			{ status: 400 },
		);
	}

	const [row] = await db
		.update(microExpenses)
		.set({
			driverId: driver_id ?? null,
			reason,
			price: String(price),
			date,
			description: description || null,
			updatedAt: new Date(),
		})
		.where(eq(microExpenses.id, expenseId))
		.returning();

	if (!row) {
		return NextResponse.json(
			{ error: "Δεν βρέθηκε το μικροέξοδο" },
			{ status: 404 },
		);
	}

	return NextResponse.json(row);
}

export async function DELETE(_request: Request, context: RouteContext) {
	try {
		await requireAuth();
	} catch {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await context.params;
	const expenseId = parseInt(id, 10);

	await db.delete(microExpenses).where(eq(microExpenses.id, expenseId));

	return NextResponse.json({ ok: true });
}
