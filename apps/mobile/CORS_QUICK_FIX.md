# Quick CORS Fix

## The Problem
Your backend at `http://192.168.100.120:3000` (or `localhost:3000`) doesn't allow requests from `http://localhost:8081` (Expo web).

## Quick Solutions

### ✅ Solution 1: Use Proxy (Already Configured)
The app is now configured to use a proxy. **Restart your Expo dev server** for changes to take effect:

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm start
# or
expo start --web
```

The proxy routes `/api/*` requests through Expo's dev server to your backend, avoiding CORS.

### ✅ Solution 2: Fix Backend CORS (Recommended)

Add CORS headers to your backend. Example for Express.js:

```javascript
const cors = require('cors');
app.use(cors({
    origin: ['http://localhost:8081', 'http://localhost:19006'],
    credentials: true,
}));
```

Then update `constants/config.ts` to use direct URL:
```typescript
// Change line 12 from:
return '/api/v1';
// To:
return 'http://localhost:3000/api/v1';
```

### ✅ Solution 3: Test on Mobile Instead
CORS only affects web browsers. Test on:
- iOS Simulator: `expo start --ios`
- Android Emulator: `expo start --android`
- Physical Device: Scan QR code

## Verify Fix

After applying a solution:
1. Check console for `[API DEBUG] API Base URL` log
2. Look for successful API requests (no CORS errors)
3. Verify Bearer token is in request headers

## Current Status

- ✅ Proxy configured in `app.json`
- ✅ Platform-specific URLs in `config.ts`
- ✅ Enhanced CORS error detection
- ⚠️ **Action Required**: Restart Expo dev server OR fix backend CORS
