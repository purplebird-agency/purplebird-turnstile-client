# @purplebird/turnstile-client

Standardized Cloudflare Turnstile integration package for Astro projects. This package provides reusable components and utilities for handling Cloudflare Turnstile with automatic token refresh to prevent expiration issues.

## Features

- ✅ **Automatic Token Refresh**: Prevents token expiration by automatically refreshing every 2 minutes
- ✅ **Non-intrusive**: Refresh happens silently without user interaction
- ✅ **TypeScript Support**: Full type definitions included
- ✅ **Development Mode**: Automatic test key fallback for local development
- ✅ **Flexible Backend**: Reusable verification utilities for Netlify functions
- ✅ **Multiple Formats**: Supports all common form submission formats

## Installation

```bash
npm install @purplebird/turnstile-client
```

## Development

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Usage

### Frontend (Astro Component)

```astro
---
import TurnstileWidget from '@purplebird/turnstile-client/src/TurnstileWidget.astro';

const siteKey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY;
---

<form>
  <!-- Your form fields -->
  
  <TurnstileWidget siteKey={siteKey} />
  
  <button type="submit">Submit</button>
</form>
```

### Component Props

- `siteKey` (required): Your Cloudflare Turnstile site key
- `containerId` (optional): Custom ID for the widget container (default: auto-generated)
- `theme` (optional): Widget theme - `'light'`, `'dark'`, or `'auto'` (default: `'auto'`)
- `size` (optional): Widget size - `'normal'` or `'compact'` (default: `'normal'`)
- `refreshInterval` (optional): Refresh interval in milliseconds (default: `120000` = 2 minutes)

### Development Mode

The component automatically uses Cloudflare's test keys in development environments:

- **Test Site Key**: `1x00000000000000000000AA`
- **Test Secret Key**: `1x0000000000000000000000000000000AA`

If `siteKey` is not provided or is empty, the component will automatically use the test site key, allowing forms to work in local development without hostname mismatch issues.

### Backend (Netlify Functions)

```javascript
const { verifyTurnstile } = require('@purplebird/turnstile-client/netlify/verify-turnstile');
const { getTurnstileToken } = require('@purplebird/turnstile-client/netlify/get-turnstile-token');

exports.handler = async (event) => {
  // Extract token from request
  const token = await getTurnstileToken(event);
  
  // Get client IP (optional but recommended)
  const clientIp = event.headers['x-forwarded-for']?.split(',')[0] ||
                   event.headers['x-nf-client-connection-ip'];
  
  // Verify token
  const secretKey = process.env.TURNSTILE_SECRET_KEY || 
                    (process.env.NODE_ENV !== 'production' 
                      ? '1x0000000000000000000000000000000AA' // Test key for dev
                      : null);
  
  const verification = await verifyTurnstile(token, secretKey, clientIp);
  
  if (!verification.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        success: false,
        error: verification.error 
      })
    };
  }
  
  // Process form submission...
};
```

### Backend API

#### `verifyTurnstile(token, secretKey, remoteIp?)`

Verifies a Turnstile token with Cloudflare's API.

**Parameters:**
- `token` (string): The Turnstile token from the form submission
- `secretKey` (string): Your Turnstile secret key
- `remoteIp` (string, optional): The client's IP address

**Returns:**
```typescript
Promise<{ success: boolean; error?: string }>
```

#### `getTurnstileToken(event)`

Extracts the Turnstile token from a Netlify function event.

**Parameters:**
- `event`: Netlify function event object

**Returns:**
```typescript
Promise<string | null>
```

Supports:
- `multipart/form-data` bodies
- `application/x-www-form-urlencoded` bodies
- `application/json` bodies
- `X-Turnstile-Token` header

## Environment Variables

### Frontend
- `PUBLIC_TURNSTILE_SITE_KEY`: Your Cloudflare Turnstile site key (public)

### Backend
- `TURNSTILE_SECRET_KEY`: Your Cloudflare Turnstile secret key (private)
- `NODE_ENV`: Set to `'production'` in production (for test key detection)

## Auto-Refresh Behavior

The widget automatically refreshes tokens every 2 minutes (configurable) to prevent expiration. This ensures users can take their time filling out forms without encountering expired token errors.

The refresh happens silently in the background and does not interrupt the user experience.

## Migration Guide

### From Existing Implementations

If you're migrating from an existing Turnstile implementation, follow these steps:

#### 1. Install the Package

```bash
npm install @purplebird/turnstile-client
```

#### 2. Update Frontend Components

**Before:**
```astro
<div class="cf-turnstile" data-sitekey={siteKey}></div>
```

**After:**
```astro
---
import TurnstileWidget from '@purplebird/turnstile-client/src/TurnstileWidget.astro';
const siteKey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY;
---

<TurnstileWidget siteKey={siteKey} />
```

#### 3. Remove Manual Auto-Refresh Code

If you have manual auto-refresh code (like in `edinburgh-clean`), you can remove it - the component handles this automatically.

#### 4. Update Backend Functions

**Before:**
```javascript
const { verifyTurnstile } = require('./utils/turnstile');
const { getTurnstileToken } = require('./utils/getTurnstileToken');
```

**After:**
```javascript
const { verifyTurnstile } = require('@purplebird/turnstile-client/netlify/verify-turnstile');
const { getTurnstileToken } = require('@purplebird/turnstile-client/netlify/get-turnstile-token');
```

**Note:** The `verifyTurnstile` function now requires `secretKey` as a parameter instead of reading from `process.env`:

```javascript
// Old way (no longer works)
const verification = await verifyTurnstile(token, clientIp);

// New way
const secretKey = process.env.TURNSTILE_SECRET_KEY || 
                  (process.env.NODE_ENV !== 'production' 
                    ? '1x0000000000000000000000000000000AA'
                    : null);
const verification = await verifyTurnstile(token, secretKey, clientIp);
```

#### 5. Remove Duplicate Utilities

After migrating, you can remove:
- `netlify/functions/utils/turnstile.js`
- `netlify/functions/utils/getTurnstileToken.js`
- Any manual auto-refresh JavaScript code

#### 6. Update Environment Variables

Ensure your `.env` files and Netlify environment variables are set:
- `PUBLIC_TURNSTILE_SITE_KEY` (frontend)
- `TURNSTILE_SECRET_KEY` (backend)

For local development, you can omit these - the package will automatically use test keys.

## Peer Dependencies

This package requires the following peer dependency (for the Netlify function):

- `busboy` (^1.6.0) - For parsing multipart/form-data

## License

MIT

## Publishing

This package uses GitHub Actions for automated publishing to npm. To publish a new version:

### Setup (One-time)

1. Create an npm access token with publish permissions
2. Add the token as a GitHub secret named `NPM_TOKEN`

### Publishing a New Version

**Using npm scripts:**
```bash
# Patch version (1.0.0 → 1.0.1)
npm run version:patch

# Minor version (1.0.0 → 1.1.0)
npm run version:minor

# Major version (1.0.0 → 2.0.0)
npm run version:major
```

These scripts will:
- Update `package.json` version
- Create a git commit and tag
- Push to GitHub
- Trigger the GitHub Action to publish to npm

## Repository

https://github.com/purplebird-agency/purplebird-turnstile-client

