# Strava Token Refresh Fix Implementation Plan

## Problem Statement

The current Strava integration is attempting to access `STRAVA_CLIENT_SECRET` from client-side code, which violates Next.js security principles and causes runtime errors. Server-side environment variables are not available in the browser context.

**Error:** `Error: Strava client credentials are not properly configured`
**Root Cause:** `refreshStravaToken` function in `src/lib/strava.ts` trying to access `STRAVA_CLIENT_SECRET` from client-side components.

## Current Architecture Issues

1. **Security Violation**: `STRAVA_CLIENT_SECRET` is being accessed client-side
2. **Mixed Context**: `strava.ts` functions used both server-side and client-side
3. **No Separation**: Token refresh logic not properly isolated to server-side

## Solution Architecture

### 1. Server-Side API Route for Token Management
Create `/api/strava/refresh-token` endpoint that:
- Accepts user authentication
- Handles token refresh using server-side credentials
- Returns new tokens securely
- Updates database with fresh tokens

### 2. Client-Side Token Validation
Modify client-side code to:
- Check token expiration before API calls
- Call server-side refresh endpoint when needed
- Handle token refresh failures gracefully

### 3. Server-Side Functions (Existing)
Keep server-side functions in `strava.ts` for:
- Server actions (`stravaActions.ts`)
- Sync operations (`strava_sync.ts`)

## Implementation Steps

### Phase 1: Server-Side API Route
1. Create `/api/strava/refresh-token/route.ts`
2. Implement secure token refresh logic
3. Add proper error handling and logging

### Phase 2: Client-Side Wrapper
1. Create client-side token manager
2. Implement automatic token refresh
3. Update existing client components

### Phase 3: Database Integration
1. Ensure token updates are persisted
2. Add proper token expiration checks
3. Handle edge cases (expired refresh tokens)

### Phase 4: Testing & Validation
1. Test token refresh flow
2. Verify security (no client-side secrets)
3. Validate all Strava integrations work

## Files to Modify

### New Files
- `src/app/api/strava/refresh-token/route.ts`
- `src/lib/strava-client.ts` (client-side utilities)

### Modified Files
- `src/lib/strava.ts` (server-side only functions)
- `src/lib/strava-token-store.ts` (enhanced token management)
- `src/components/run/StravaRunList.tsx`
- `src/components/dashboard/RecentRun.tsx`
- `src/components/run/RunList.tsx`

## Security Considerations

1. **Environment Variables**: Only `NEXT_PUBLIC_*` vars accessible client-side
2. **Token Refresh**: Must happen server-side with proper authentication
3. **Error Handling**: Don't expose sensitive information in errors
4. **Rate Limiting**: Implement proper API rate limiting

## Success Criteria

1. ✅ No client-side access to `STRAVA_CLIENT_SECRET`
2. ✅ Automatic token refresh works seamlessly
3. ✅ All Strava components function correctly
4. ✅ Database tokens are kept up-to-date
5. ✅ Proper error handling and user feedback

## ADR Required

This change constitutes a major architectural pattern change requiring an ADR for:
- Moving token refresh to server-side only
- Creating new API endpoint pattern
- Changing client-side token management approach 