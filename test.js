import 'dotenv/config';
import { createRequire } from 'module';
import { parseEvent } from './src/parseEvent.js';
import { createEvent } from './src/createEvent.js';

const require = createRequire(import.meta.url);
const calendars = require('./calendars.json');

const message = process.argv[2];
if (!message) {
  console.error('Usage: node test.js "Your message here"');
  process.exit(1);
}

const parsed = await parseEvent(message);

console.log('\nParsed JSON:');
console.log(JSON.stringify(parsed, null, 2));

if (parsed.error) {
  console.log('\nNo calendar event detected.');
  process.exit(0);
}

const person = parsed.person || null;
const calendarId = (person && calendars[person]) || calendars.default;
const eventTitle = person ? `${person} - ${parsed.title}` : parsed.title;

console.log('\nPerson detected:', person ?? '(none — routed to General)');
console.log('Calendar ID:    ', calendarId);

const event = await createEvent({ ...parsed, title: eventTitle }, calendarId);

console.log('Event link:     ', event.htmlLink);
