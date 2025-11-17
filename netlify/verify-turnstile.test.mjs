import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

describe('verify-turnstile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should verify a valid token', async () => {
    const { verifyTurnstile } = await import('./verify-turnstile.js');
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const result = await verifyTurnstile('valid-token', 'secret-key');
    
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    );
  });

  it('should return error when secret key is missing', async () => {
    const { verifyTurnstile } = await import('./verify-turnstile.js');
    
    const result = await verifyTurnstile('token', '');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Turnstile verification is not configured');
  });

  it('should return error when token is missing', async () => {
    const { verifyTurnstile } = await import('./verify-turnstile.js');
    
    const result = await verifyTurnstile('', 'secret-key');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Turnstile token is missing');
  });

  it('should return error when verification fails', async () => {
    const { verifyTurnstile } = await import('./verify-turnstile.js');
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: false,
        'error-codes': ['invalid-input-response']
      }),
    });

    const result = await verifyTurnstile('invalid-token', 'secret-key');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Security verification failed. Please try again.');
  });

  it('should include remote IP when provided', async () => {
    const { verifyTurnstile } = await import('./verify-turnstile.js');
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await verifyTurnstile('token', 'secret-key', '192.168.1.1');
    
    const callArgs = global.fetch.mock.calls[0];
    const body = callArgs[1].body;
    
    expect(body.toString()).toContain('remoteip=192.168.1.1');
  });

  it('should handle network errors', async () => {
    const { verifyTurnstile } = await import('./verify-turnstile.js');
    
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await verifyTurnstile('token', 'secret-key');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Security verification error. Please try again.');
  });

  it('should handle non-ok responses', async () => {
    const { verifyTurnstile } = await import('./verify-turnstile.js');
    
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const result = await verifyTurnstile('token', 'secret-key');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Security verification failed. Please try again.');
  });

  it('should handle malformed JSON responses', async () => {
    const { verifyTurnstile } = await import('./verify-turnstile.js');
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    const result = await verifyTurnstile('token', 'secret-key');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Security verification error. Please try again.');
  });

  it('should include correct form data in request', async () => {
    const { verifyTurnstile } = await import('./verify-turnstile.js');
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await verifyTurnstile('test-token-123', 'test-secret-456', '192.168.1.1');
    
    const callArgs = global.fetch.mock.calls[0];
    const body = callArgs[1].body;
    const bodyString = body.toString();
    
    expect(bodyString).toContain('secret=test-secret-456');
    expect(bodyString).toContain('response=test-token-123');
    expect(bodyString).toContain('remoteip=192.168.1.1');
  });

  it('should not include remoteip when not provided', async () => {
    const { verifyTurnstile } = await import('./verify-turnstile.js');
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await verifyTurnstile('test-token', 'test-secret');
    
    const callArgs = global.fetch.mock.calls[0];
    const body = callArgs[1].body;
    const bodyString = body.toString();
    
    expect(bodyString).toContain('secret=test-secret');
    expect(bodyString).toContain('response=test-token');
    expect(bodyString).not.toContain('remoteip');
  });

  it('should handle empty error codes array', async () => {
    const { verifyTurnstile } = await import('./verify-turnstile.js');
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: false,
        'error-codes': []
      }),
    });

    const result = await verifyTurnstile('token', 'secret-key');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Security verification failed. Please try again.');
  });

  it('should handle multiple error codes', async () => {
    const { verifyTurnstile } = await import('./verify-turnstile.js');
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: false,
        'error-codes': ['invalid-input-response', 'timeout-or-duplicate']
      }),
    });

    const result = await verifyTurnstile('token', 'secret-key');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Security verification failed. Please try again.');
  });
});

