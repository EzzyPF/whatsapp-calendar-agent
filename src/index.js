import 'dotenv/config';
import express from 'express';
import { createRequire } from 'module';
import { verifyTwilio } from './verify.js';
import { parseEvent } from './parseEvent.js';
import { createEvent } from './createEvent.js';

const require = createRequire(import.meta.url);
const calendars = require('../calendars.json');

const app = express();
const PORT = process.env.PORT || 3000;

// Twilio sends webhook data as URL-encoded form fields.
app.use(express.urlencoded({ extended: false }));

// Helper: wrap a message in TwiML so Twilio can relay it back to WhatsApp.
function twiml(message) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response><Message>${message}</Message></Response>`;
}

// Format HH:MM (24-hour) as "3:30 PM".
function fmt12(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${period}` : `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

// Build the confirmation reply, e.g. "✓ Added to Sikandar's calendar: Gym, Fri Jun 19, 3:30–4:30 PM"
function buildReply(calendarLabel, parsed) {
  const dateStr = new Date(`${parsed.date}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/Toronto',
  });
  const timeRange = `${fmt12(parsed.startTime)}–${fmt12(parsed.endTime)}`;
  return `✓ Added to ${calendarLabel}: ${parsed.title}, ${dateStr}, ${timeRange}`;
}

// POST /webhook/whatsapp — entry point for all incoming WhatsApp messages.
app.post('/webhook/whatsapp', verifyTwilio, async (req, res) => {
  res.set('Content-Type', 'text/xml');

  const sender = req.body.From;
  const messageText = req.body.Body;

  // Only accept messages from the configured WhatsApp number.
  if (sender !== process.env.ALLOWED_SENDER) {
    return res.send(twiml('Unauthorized sender.'));
  }

  try {
    // Step 1: Ask Claude to extract event details (including person) from the raw message.
    const parsed = await parseEvent(messageText);

    if (parsed.error) {
      return res.send(twiml('No calendar event detected in your message.'));
    }

    // Step 2: Route to the correct calendar based on the person field.
    const person = parsed.person || null;
    const calendarId = (person && calendars[person]) || calendars.default;
    const calendarLabel = person ? `${person}'s calendar` : 'the General calendar';
    const eventTitle = person ? `${person} - ${parsed.title}` : parsed.title;

    // Step 3: Create the event on the routed calendar.
    await createEvent({ ...parsed, title: eventTitle }, calendarId);

    return res.send(twiml(buildReply(calendarLabel, parsed)));
  } catch (err) {
    console.error('Webhook error:', err);
    return res.send(twiml('Error processing your message. Please try again.'));
  }
});

app.listen(PORT, () => {
  console.log(`WhatsApp Calendar Agent running on port ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/webhook/whatsapp`);
});
