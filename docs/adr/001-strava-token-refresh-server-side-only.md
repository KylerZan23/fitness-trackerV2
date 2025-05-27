# ADR-001: Strava Token Refresh Server-Side Only

## Status
Accepted

## Date
2024-12-28

## Context

The Strava integration was attempting to access `STRAVA_CLIENT_SECRET` from client-side code, which violates Next.js security principles and causes runtime errors. Server-side environment variables (those without the `NEXT_PUBLIC_` prefix) are not available in the browser context for security reasons.

### Problem
- `refreshStravaToken` function in `src/lib/strava.ts` was trying to access `STRAVA_CLIENT_SECRET` from client-side components
- This caused the error: `Error: Strava client credentials are not properly configured`
- Mixed context usage where `strava.ts` functions were used both server-side and client-side
- Security violation exposing sensitive credentials to the browser

### Impact
- All Strava integrations were broken
- Users could not fetch their runs from Strava
- Token refresh was failing, preventing API access

## Decision

We will implement a strict separation between server-side and client-side Strava operations:

1. **Server-Side API Route**: Create `/api/strava/refresh-token` endpoint for secure token refresh
2. **Client-Side Utilities**: Create `src/lib/strava-client.ts` for browser-safe operations
3. **Token Management**: All token refresh operations happen server-side with proper authentication
4. **Database Integration**: Automatic token updates when refreshed

## Implementation

### New Files Created
- `src/app/api/strava/refresh-token/route.ts` - Secure server-side token refresh endpoint
- `src/lib/strava-client.ts` - Client-side utilities for Strava API interactions

### Modified Files
- `src/components/run/StravaRunList.tsx` - Updated to use client-side utilities
- `src/components/dashboard/RecentRun.tsx` - Updated to use client-side utilities  
- `src/components/run/RunList.tsx` - Updated to use client-side utilities
- `src/lib/strava-token-store.ts` - Enhanced with token update capabilities

### Architecture Changes
1. **Token Refresh Flow**:
   - Client detects expired token
   - Client calls `/api/strava/refresh-token` with refresh token
   - Server validates user authentication
   - Server calls Strava API with client secret
   - Server updates database with new tokens
   - Server returns new access token to client

2. **Security Improvements**:
   - `STRAVA_CLIENT_SECRET` never exposed to browser
   - All token operations require user authentication
   - Automatic token persistence to database
   - Proper error handling without exposing sensitive data

## Consequences

### Positive
- ✅ Secure token management following Next.js best practices
- ✅ Automatic token refresh without user intervention
- ✅ Proper separation of server-side and client-side concerns
- ✅ Database tokens stay up-to-date automatically
- ✅ All Strava integrations work correctly

### Negative
- Additional API endpoint to maintain
- Slightly more complex token management flow
- Network overhead for token refresh calls

### Neutral
- Existing server-side functions in `strava.ts` remain unchanged
- No impact on server actions or sync operations

## Compliance

This change ensures compliance with:
- Next.js security best practices
- OAuth 2.0 security guidelines
- Principle of least privilege
- Separation of concerns architecture

## Alternatives Considered

1. **Environment Variable Exposure**: Making `STRAVA_CLIENT_SECRET` public - Rejected due to security risks
2. **Server Actions Only**: Moving all Strava operations to server actions - Rejected due to complexity and performance
3. **Client-Side Token Storage**: Storing tokens in localStorage only - Rejected due to persistence and security concerns

## Notes

- This change is backward compatible with existing server-side operations
- Client components now handle token refresh transparently
- Database integration ensures tokens persist across sessions
- Error handling provides clear user feedback without exposing sensitive information 