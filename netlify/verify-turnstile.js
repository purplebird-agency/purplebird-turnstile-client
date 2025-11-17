/**
 * Verify Cloudflare Turnstile token
 * @param {string} token - The Turnstile token from the form submission
 * @param {string} secretKey - The Turnstile secret key
 * @param {string} remoteIp - The IP address of the client (optional)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function verifyTurnstile(token, secretKey, remoteIp = null) {
  if (!secretKey) {
    console.error('Turnstile secret key is required');
    return {
      success: false,
      error: 'Turnstile verification is not configured'
    };
  }

  if (!token) {
    return {
      success: false,
      error: 'Turnstile token is missing'
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      console.error('Turnstile verification request failed with status:', response.status, response.statusText);
      return {
        success: false,
        error: 'Security verification failed. Please try again.',
      };
    }

    const data = await response.json();

    if (!data.success) {
      console.error('Turnstile verification failed:', data['error-codes']);
      return {
        success: false,
        error: 'Security verification failed. Please try again.'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error verifying Turnstile token:', error);
    return {
      success: false,
      error: 'Security verification error. Please try again.'
    };
  }
}

module.exports = { verifyTurnstile };

