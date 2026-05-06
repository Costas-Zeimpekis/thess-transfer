import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calendarBackups } from "@/lib/db/schema";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  try { await requireAuth(); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const rows = await db
    .select()
    .from(calendarBackups)
    .where(eq(calendarBackups.id, parseInt(id)))
    .limit(1);

  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new Response(rows[0].icsContent, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="backup-${rows[0].calendarId}-${rows[0].createdAt?.toISOString().slice(0, 10)}.ics"`,
    },
  });
}

export async function DELETE(_req: Request, context: RouteContext) {
  try { await requireAuth(); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  await db.delete(calendarBackups).where(eq(calendarBackups.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
