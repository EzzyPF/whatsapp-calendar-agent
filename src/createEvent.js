import { google } from 'googleapis';

// Builds a Google Calendar API client authenticated via a service account key file.
function getCalendarClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_PATH || './service-account.json',
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
// calendarId overrides the env default and is supplied by the routing logic in index.js.
export async function createEvent(eventData, calendarId) {
  const calendar = getCalendarClient();
  const resolvedCalendarId = calendarId || process.env.GOOGLE_CALENDAR_ID || 'primary';
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

  const { data } = await calendar.events.insert({ calendarId: resolvedCalendarId, resource });

  console.log(`Event created: ${data.htmlLink}`);
  return data;
}
