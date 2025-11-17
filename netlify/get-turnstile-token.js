const busboy = require('busboy');

/**
 * Extract the Cloudflare Turnstile token from an incoming Netlify function event.
 * Supports multipart/form-data, application/x-www-form-urlencoded, and JSON bodies.
 *
 * @param {import('@netlify/functions').HandlerEvent} event
 * @returns {Promise<string|null>}
 */
async function getTurnstileToken(event) {
  const headers = event.headers || {};
  const headerToken =
    headers['x-turnstile-token'] ||
    headers['X-Turnstile-Token'];
  if (headerToken) {
    return headerToken;
  }

  const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';

  if (contentType.includes('multipart/form-data')) {
    return parseMultipart(event, contentType);
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const body = getTextBody(event);
    const params = new URLSearchParams(body);
    return params.get('cf-turnstile-response');
  }

  if (contentType.includes('application/json')) {
    try {
      const body = getTextBody(event);
      const payload = JSON.parse(body);
      return (
        payload['cf-turnstile-response'] ||
        payload.cfTurnstileResponse ||
        null
      );
    } catch (error) {
      console.error('Failed to parse JSON body while extracting Turnstile token:', error);
      return null;
    }
  }

  return null;
}

async function parseMultipart(event, contentType) {
  let token = null;

  await new Promise((resolve, reject) => {
    const bb = busboy({
      headers: {
        'content-type': contentType,
      },
    });

    bb.on('field', (name, value) => {
      if (name === 'cf-turnstile-response') {
        token = value;
      }
    });

    bb.on('finish', resolve);
    bb.on('error', reject);

    const body = getBodyBuffer(event);
    bb.end(body);
  });

  return token;
}

function getBodyBuffer(event) {
  if (!event.body) {
    return Buffer.alloc(0);
  }

  return event.isBase64Encoded
    ? Buffer.from(event.body, 'base64')
    : Buffer.from(event.body, 'utf8');
}

function getTextBody(event) {
  if (!event.body) {
    return '';
  }

  return event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;
}

module.exports = { getTurnstileToken };

