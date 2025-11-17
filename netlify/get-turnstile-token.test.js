const { describe, it, expect } = require('vitest');

describe('get-turnstile-token', () => {
  it('should extract token from X-Turnstile-Token header', async () => {
    const { getTurnstileToken } = require('./get-turnstile-token');
    
    const event = {
      headers: {
        'x-turnstile-token': 'header-token-123',
      },
    };

    const token = await getTurnstileToken(event);
    expect(token).toBe('header-token-123');
  });

  it('should extract token from X-Turnstile-Token header (case insensitive)', async () => {
    const { getTurnstileToken } = require('./get-turnstile-token');
    
    const event = {
      headers: {
        'X-Turnstile-Token': 'header-token-456',
      },
    };

    const token = await getTurnstileToken(event);
    expect(token).toBe('header-token-456');
  });

  it('should extract token from form-urlencoded body', async () => {
    const { getTurnstileToken } = require('./get-turnstile-token');
    
    const event = {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: 'cf-turnstile-response=form-token-123&other=value',
      isBase64Encoded: false,
    };

    const token = await getTurnstileToken(event);
    expect(token).toBe('form-token-123');
  });

  it('should extract token from JSON body', async () => {
    const { getTurnstileToken } = require('./get-turnstile-token');
    
    const event = {
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        'cf-turnstile-response': 'json-token-123',
      }),
      isBase64Encoded: false,
    };

    const token = await getTurnstileToken(event);
    expect(token).toBe('json-token-123');
  });

  it('should extract token from JSON body with camelCase', async () => {
    const { getTurnstileToken } = require('./get-turnstile-token');
    
    const event = {
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        cfTurnstileResponse: 'camel-token-123',
      }),
      isBase64Encoded: false,
    };

    const token = await getTurnstileToken(event);
    expect(token).toBe('camel-token-123');
  });

  it('should handle base64 encoded body', async () => {
    const { getTurnstileToken } = require('./get-turnstile-token');
    
    const body = Buffer.from('cf-turnstile-response=encoded-token-123').toString('base64');
    const event = {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: body,
      isBase64Encoded: true,
    };

    const token = await getTurnstileToken(event);
    expect(token).toBe('encoded-token-123');
  });

  it('should return null when token is not found', async () => {
    const { getTurnstileToken } = require('./get-turnstile-token');
    
    const event = {
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ other: 'value' }),
      isBase64Encoded: false,
    };

    const token = await getTurnstileToken(event);
    expect(token).toBe(null);
  });

  it('should return null for unsupported content type', async () => {
    const { getTurnstileToken } = require('./get-turnstile-token');
    
    const event = {
      headers: {
        'content-type': 'text/plain',
      },
      body: 'some content',
      isBase64Encoded: false,
    };

    const token = await getTurnstileToken(event);
    expect(token).toBe(null);
  });

  it('should handle empty body', async () => {
    const { getTurnstileToken } = require('./get-turnstile-token');
    
    const event = {
      headers: {
        'content-type': 'application/json',
      },
      body: '',
      isBase64Encoded: false,
    };

    const token = await getTurnstileToken(event);
    expect(token).toBe(null);
  });

  it('should handle missing headers', async () => {
    const { getTurnstileToken } = require('./get-turnstile-token');
    
    const event = {
      headers: {},
      body: '',
      isBase64Encoded: false,
    };

    const token = await getTurnstileToken(event);
    expect(token).toBe(null);
  });

  // Note: multipart/form-data tests would require mocking busboy
  // which is complex. These are covered by integration tests in actual usage.
});

