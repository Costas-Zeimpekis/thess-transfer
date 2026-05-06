import { google } from "googleapis";

const CALENDAR_ID = "bkkostas@gmail.com";

const auth = new google.auth.GoogleAuth({
  credentials: {
    type: "service_account",
    project_id: "test-callendar-api",
    private_key_id: "5b5ce6848503abe78f4de05c808007abf38e2bdb",
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDgX2v09lxa72Qk\nPusVdn2DjQThwIDE9bHQKv/N7E7sDUPGOFshannKayWT4x26RtZ7GUScuEgfS9xI\nHZogSHUsgSbqYj3cGgxIUYrARCxwpyg2VFhVwT652a+tQIU8n6kzqKULXsp0FmPP\nXYp1Z3zMs3SLJZNaH9umVzDbUZFjVw0dgaMqUnSR9g/486h5krlIecyA0+ZVznHL\nzR2MHe1vYqNlvjmGC+ouF4IZ2l5BWktAvBLAJO1xFk8uUFKGK/ytxlRrDpmWIewY\nvXYrcnhmeBMuFbLhOrHIfqyOa0hRwfdJl8+j9EN1+a1+E/5CBYd6FG1aLSqQYvsf\nVmY44Y4xAgMBAAECggEAZLegw9jU80LznmuZ5kwGoocqUlYx13f8xhePNXYmpUJ9\nEl0Y10KvAgSf3Sc9oHEM9TwN9xWn1licvMiA943e/0fIWr0XzJXqvonP8WeI1VbL\nr7uj3Xa9+/oyKGDGjkSTVOuWjqiR05N7YUm5jeMS++ZwYcfPwcx8MkqAVWrjiwXg\n4G7H3STUu0FYKBMu6v2Ig19oYCJNH+DmbIk4dNzW1VJsXOTzjRVKWHuqLsMBhmBP\nd0ol0G6PKvfiohWIlxkXjQvv4IZ9iFGNWcrzSAEQcqi0B6wwuDAwb8aUNvPGH81z\nXaMIT6I4JcYwpDdvTfMEOyxrkbPX3UsQSR528HOLQwKBgQDya2D765Lz8afQaVfV\nhcAgsLcmDuDdFhTkCl945kNLixgnh0Wa/69UqIbLlCohD2J784UcXPOhV3EyRII7\nRQy2Ckyzl6nPl7OUi5bcTDX20XfIrtVEnr3utZmcw0fzrLw1R4YEoA4eh+4usvKC\nyT0GAj0jo4AA8gNpgPPWLEUhmwKBgQDs8TqR1IMjQL5wju5rUHpJvqeX7gedN17k\nwkD0PXQXMGacitQ/XAGKOWIrObj9owIt+WeY2VGuUK0Olw5jcZPlA471H1d1AeOr\ncKhlLE179WaRgsmBct3wykSG8yd/jJhl9ADrmBbt+ykFnU9I/y/x5pgtysh9mtmB\nSI8taIxCIwKBgDgWZgMDVyW/xJ7wsJTDdFdb65QPnzEn2b+FMt+rDujcjsMehhk9\njRheQYm6hyDNCXE6P5L3Ypryu0rxFNyXtkAsE+D9dxmDtNXqkgX4UAgCIN+6q7dL\nrxAazia5+9zCG22MVdKeIYYo1w/Q8VEXNFo+jFzBiG0vkWCIqGHmLjx/AoGBAMq8\nrazR9VNYtpqA8igIuFoZNDWfigxPsHZ0cDeLzaV52JLhhzKfewHWj9UEkvETZW4J\nFUeHy4gnp6vwPHOCX1V5cfzzUFXhw/iRcMUA31vNYnHnQpvsuVKq/2+o5ocQueWi\nnpb3j8cZPMR9EbYYA+IruNKVzG8M7Ebe2wOzjS+ZAoGBAOKCb6feMqOQAL1pEkd6\nzNZAMe2QirCOzd1Y75yFbM5ZzVO/V9TRKUf9mbWbC5t9QvUYoX2PawBPEj+uPEIS\n8Xs+3FVimnWEv3V3gutzJgA9JcPCizjObI6kw6m8zE5pHJHffaIRLk7CoVD30aE7\nM7PJWRFdUPE4FIOruvzc+Rtz\n-----END PRIVATE KEY-----\n",
    client_email: "callendar-api-test@test-callendar-api.iam.gserviceaccount.com",
    client_id: "113485937466807650142",
  },
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

const calendar = google.calendar({ version: "v3", auth });

const now = new Date();
const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
const endOfToday   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

async function run() {
  console.log(`--- Events for today (${startOfToday.toLocaleDateString("el-GR")}) ---`);

  const list = await calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin: startOfToday.toISOString(),
    timeMax: endOfToday.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  const items = list.data.items ?? [];
  if (items.length === 0) {
    console.log("No events today.");
  } else {
    items.forEach((e) => {
      const time = e.start?.dateTime
        ? new Date(e.start.dateTime).toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" })
        : "Όλη μέρα";
      console.log(`\n  ${time} — ${e.summary}`);
      if (e.description) console.log(`           ${e.description}`);
      if (e.location)    console.log(`           📍 ${e.location}`);
    });
  }
}

run().catch(console.error);
