import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import ical from "ical-generator";
import { google } from "googleapis";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calendarBackups } from "@/lib/db/schema";

function getCalendarClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CALENDAR_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_CALENDAR_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });
  return google.calendar({ version: "v3", auth });
}

export async function GET() {
  try { await requireAuth(); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const backups = await db
    .select({
      id: calendarBackups.id,
      calendarId: calendarBackups.calendarId,
      eventsCount: calendarBackups.eventsCount,
      createdAt: calendarBackups.createdAt,
    })
    .from(calendarBackups)
    .orderBy(desc(calendarBackups.createdAt));

  return NextResponse.json(backups);
}

export async function POST(request: Request) {
  try { await requireAuth(); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { calendarId } = await request.json();
  if (!calendarId) {
    return NextResponse.json({ error: "calendarId required" }, { status: 400 });
  }

  const calendar = getCalendarClient();

  // Fetch all events (paginate if needed)
  const allEvents: {
    summary?: string | null;
    description?: string | null;
    location?: string | null;
    start?: { dateTime?: string | null; date?: string | null };
    end?: { dateTime?: string | null; date?: string | null };
    uid?: string | null;
  }[] = [];

  let pageToken: string | undefined;
  do {
    const res = await calendar.events.list({
      calendarId,
      singleEvents: true,
      maxResults: 2500,
      pageToken,
    });
    allEvents.push(...(res.data.items ?? []));
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  // Build .ics
  const cal = ical({ name: calendarId });
  for (const e of allEvents) {
    const startRaw = e.start?.dateTime ?? e.start?.date;
    const endRaw   = e.end?.dateTime   ?? e.end?.date;
    if (!startRaw || !endRaw) continue;
    cal.createEvent({
      id: e.uid ?? undefined,
      summary: e.summary ?? "(no title)",
      description: e.description ?? undefined,
      location: e.location ?? undefined,
      start: new Date(startRaw),
      end:   new Date(endRaw),
    });
  }

  const icsContent = cal.toString();

  const result = await db
    .insert(calendarBackups)
    .values({ calendarId, eventsCount: allEvents.length, icsContent })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
