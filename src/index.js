import 'dotenv/config';
import express from 'express';
import { verifyTwilio } from './verify.js';
import { parseEvent } from './parseEvent.js';
import { createEvent } from './createEvent.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Twilio sends webhook data as URL-encoded form fields.
app.use(express.urlencoded({ extended: false }));

// Helper: wrap a message in TwiML so Twilio can relay it back to WhatsApp.
function twiml(message) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response><Message>${message}</Message></Response>`;
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
    // Step 1: Ask Claude to extract event details from the raw message.
    const parsed = await parseEvent(messageText);

    if (parsed.error) {
      return res.send(twiml('No calendar event detected in your message.'));
    }

    // Step 2: Create the event in Google Calendar.
    await createEvent(parsed);

    return res.send(
      twiml(`Event created: "${parsed.title}" on ${parsed.date} at ${parsed.startTime}.`)
    );
  } catch (err) {
    console.error('Webhook error:', err);
    return res.send(twiml('Error processing your message. Please try again.'));
  }
});

app.listen(PORT, () => {
  console.log(`WhatsApp Calendar Agent running on port ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/webhook/whatsapp`);
});
