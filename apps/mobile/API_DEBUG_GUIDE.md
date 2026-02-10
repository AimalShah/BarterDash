# API Debugging Guide

## Overview
All API calls now include comprehensive logging and proper Bearer token handling.

## Bearer Token Handling

### Automatic Token Injection
All API calls made through the `api` instance (from `services/api.ts`) automatically include the Bearer token in the Authorization header.

**How it works:**
1. Request interceptor gets the current session from Supabase
2. Extracts `access_token` from the session
3. Adds `Authorization: Bearer <token>` header to all requests

### Services Using API Instance
All these services automatically include Bearer tokens:
- ✅ `auctionsService` - All auction operations
- ✅ `bidsService` - All bid operations  
- ✅ `usersService` - User profile operations
- ✅ `sellersService` - Seller operations
- ✅ `paymentsService` - Payment operations

### Direct Fetch Calls
These calls manually add Bearer tokens (used during auth flow):
- `app/auth/landing.tsx` - Profile sync after Google OAuth
- `app/register.tsx` - Profile sync after registration

## Debug Logging

### Request Logging
Every API request logs:
```
[API DEBUG] Request: {
  method: "GET" | "POST" | "PUT" | "DELETE",
  url: "/api/endpoint",
  hasToken: true/false,
  tokenPreview: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response Logging
Every API response logs:
```
[API DEBUG] Response: {
  status: 200,
  url: "/api/endpoint",
  method: "GET"
}
```

### Error Logging
API errors log detailed information:
```
[API DEBUG] API Error: {
  status: 401,
  url: "/api/endpoint",
  method: "GET",
  data: { error: "Unauthorized" }
}
```

### 401 Handling
When a 401 Unauthorized is received:
1. Logs warning about expired session
2. Checks if session still exists
3. Components should handle redirect to login

## Testing API Calls

### Check if Token is Present
1. Open React Native Debugger or Metro console
2. Look for `[API DEBUG] Request:` logs
3. Verify `hasToken: true` and token preview is shown

### Verify Token in Headers
The token is automatically added to headers as:
```
Authorization: Bearer <access_token>
```

### Common Issues

**Issue: Token not being added**
- Check if user is logged in: `useAuth().session`
- Verify session has `access_token`
- Check console for `[API DEBUG] Request without token` warnings

**Issue: 401 Unauthorized**
- Token may be expired
- Check `[API DEBUG] API Error` logs
- Session may need refresh
- User may need to re-login

**Issue: Network errors**
- Check `[API DEBUG] Network Error` logs
- Verify API_BASE_URL is correct
- Check device/emulator network connection

## Logout Flow

### Logout Process
1. Calls `supabase.auth.signOut({ scope: 'global' })`
2. Clears local React state (session, user)
3. Clears all AsyncStorage auth keys
4. Verifies session is cleared
5. Redirects to `/auth/landing`

### Logout Debugging
Check console for:
```
[AUTH DEBUG] ========== LOGOUT INITIATED ==========
[AUTH DEBUG] Step 1: Signing out from Supabase...
[AUTH DEBUG] Step 2: Clearing local state...
[AUTH DEBUG] Step 3: Clearing AsyncStorage...
[AUTH DEBUG] Step 4: Verifying session is cleared...
[AUTH DEBUG] ========== LOGOUT COMPLETE ==========
```

### If Logout Doesn't Work
1. Check console for errors in logout steps
2. Verify AsyncStorage keys are being cleared
3. Check if session verification shows session still exists
4. Try manual logout: `await supabase.auth.signOut()`

## API Service Checklist

All services are properly configured:
- ✅ `services/api.ts` - Base axios instance with interceptors
- ✅ `services/auctions.ts` - Uses api instance
- ✅ `services/bids.ts` - Uses api instance
- ✅ `services/users.ts` - Uses api instance
- ✅ `services/sellers.ts` - Uses api instance
- ✅ `services/payments.ts` - Uses api instance

## Environment Variables

Make sure these are set:
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `API_BASE_URL` (in constants/config.ts) - Backend API URL
