import twilio from 'twilio';

// Twilio webhook signature verification middleware.
// In production, Twilio signs every request with your Auth Token so you can
// confirm it genuinely came from Twilio and not a third party.
export function verifyTwilio(req, res, next) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  // Skip validation in dev mode when no auth token is configured.
  if (!authToken) {
    return next();
  }

  // Build the full public URL Twilio signed — must match exactly.
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const fullUrl = `${protocol}://${host}${req.originalUrl}`;

  const twilioSignature = req.headers['x-twilio-signature'] || '';

  // twilio.validateRequest returns true if the signature matches.
  const isValid = twilio.validateRequest(authToken, twilioSignature, fullUrl, req.body);

  if (!isValid) {
    res.status(403).send('Forbidden: invalid Twilio signature');
    return;
  }

  next();
}
