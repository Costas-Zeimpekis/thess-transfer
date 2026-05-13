import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { systemLogs } from "@/lib/db/schema";

export async function GET(request: Request) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const level = searchParams.get("level");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const conditions = [];

  if (level && level !== "all") {
    conditions.push(eq(systemLogs.level, level));
  }
  if (from) {
    conditions.push(gte(systemLogs.createdAt, new Date(from)));
  }
  if (to) {
    const toDate = new Date(to);
    toDate.setUTCHours(23, 59, 59, 999);
    conditions.push(lte(systemLogs.createdAt, toDate));
  }

  const logs = await db
    .select()
    .from(systemLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(systemLogs.createdAt))
    .limit(500);

  return NextResponse.json(logs);
}

export async function PATCH(request: Request) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ids } = await request.json();

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No ids provided" }, { status: 400 });
  }

  await db.update(systemLogs).set({ read: true }).where(inArray(systemLogs.id, ids));

  return NextResponse.json({ ok: true });
}
