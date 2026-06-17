import { google } from 'googleapis';

// Builds a Google Calendar API client authenticated via a service account key file.
function getCalendarClient() {
  // Read service-account credentials from an env var (production) or fall back
  // to the local file (development), so the app works both on Railway and locally.
  let credentials;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  }

  const auth = new google.auth.GoogleAuth({
    ...(credentials
      ? { credentials }
      : { keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_PATH || './service-account.json' }),
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  return google.calendar({ version: 'v3', auth });
}

// Combines a YYYY-MM-DD date string and HH:MM time string into an RFC3339 dateTime
// that Google Calendar requires. We append the timezone as a named zone via timeZone
// rather than a numeric offset so daylight-saving transitions are handled correctly.
function toDateTime(date, time) {
  return `${date}T${time}:00`;
}

// Creates a Google Calendar event from the structured data returned by parseEvent().
// calendarId must be supplied by the caller — no fallback, so a missing/wrong ID
// surfaces immediately as an error rather than silently landing on the wrong calendar.
export async function createEvent(eventData, calendarId) {
  if (!calendarId) throw new Error('createEvent called without a calendarId');

  const calendar = getCalendarClient();
  const timeZone = process.env.TIMEZONE || 'America/Toronto';

  const resource = {
    summary: eventData.title,
    description: eventData.description || undefined,
    location: eventData.location || undefined,
    start: {
      dateTime: toDateTime(eventData.date, eventData.startTime),
      timeZone,
    },
    end: {
      dateTime: toDateTime(eventData.date, eventData.endTime),
      timeZone,
    },
  };

  const { data } = await calendar.events.insert({ calendarId, resource });

  console.log(`Event created: ${data.htmlLink}`);
  return data;
}
