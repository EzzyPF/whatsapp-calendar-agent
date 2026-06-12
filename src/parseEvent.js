import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Calls Claude to extract structured event data from a raw WhatsApp message.
export async function parseEvent(messageText) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
  const systemPrompt = `You are a calendar assistant. Extract event details from natural language text.
Return ONLY a raw JSON object — no markdown, no backticks, no extra text.

Today's date is ${today} (America/Toronto timezone). Resolve all relative dates ("tomorrow", "next Monday", "Friday", etc.) against this date.

Required fields:
- title (string)
- date (YYYY-MM-DD)
- startTime (HH:MM, 24-hour)
- endTime (HH:MM, 24-hour) — if not mentioned, default to 1 hour after startTime
- description (string or null)
- location (string or null)
- person (string or null) — who this event is for. Valid values: "Sikandar" or "Muriam".
  Normalize variants: "Sikander" or any misspelling → "Sikandar"; "Murium", "Mariam", or any misspelling → "Muriam".
  Return null if no person is mentioned.

If the message does not describe a calendar event, return exactly:
{"error":"no event found"}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: messageText }],
  });

  const rawText = response.content[0].text.trim();

  try {
    return JSON.parse(rawText);
  } catch {
    throw new Error(`Claude returned non-JSON response: ${rawText}`);
  }
}
