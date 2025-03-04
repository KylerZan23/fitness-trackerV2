# Maintenance Guide: Authentication System

## Overview

This document provides maintenance guidelines for the authentication system in the Fitness Tracker V2 application, with a focus on troubleshooting the "Auth session missing!" error.

## Recent Authentication System Changes

### 1. Enhanced Logging

We've implemented detailed logging throughout the authentication flow:

- **Client-side (Login Page):**
  - Session verification before API calls
  - Token availability and format logging
  - Detailed error handling for profile creation failures

- **Server-side (API Routes):**
  - Token verification process logging
  - Detailed error object serialization
  - User verification and matching

These logs help identify exactly where in the authentication process failures occur.

### 2. Token Verification Improvements

To enhance token verification:

- Added delay to ensure token propagation
- Using `verifiedSession` data in API calls
- Improved error handling with specific error messages
- Added comprehensive documentation for troubleshooting

### 3. RLS (Row-Level Security) Policies

- Reset and properly configured RLS policies for the profiles table
- Ensured policies allow:
  - Users to view their own profiles
  - Users to update their own profiles
  - Users to insert profiles where the ID matches their auth ID

## Known Issues and Resolutions

### "Auth session missing!" Error

**Common Causes:**
1. Token verification timing issues
2. Environment variable misconfiguration
3. Supabase service role key issues
4. Client/server token format inconsistencies

**Resolution Steps:**
1. Use the `scripts/test-token.js` tool to verify tokens independently
2. Check environment variables are correctly set and accessible
3. Increase token propagation delay if needed
4. Ensure Supabase project settings match environment variables

## Monitoring and Maintaining

### Logs to Monitor

When users report authentication issues:

1. Check server logs for:
   - "API - Profile Creation: setSession Error"
   - "API - Profile Creation: Complete error object"
   - "User ID mismatch" messages

2. Request browser console logs for:
   - "Auth session missing detected"
   - Session verification information
   - Token length and format information

### Testing Authentication Flow

After any changes to the authentication system:

1. Run through complete login flow as a new user
2. Test profile creation for new users
3. Verify RLS policies by attempting to access other users' profiles
4. Test token verification using the standalone script

## Future Improvements

Consider implementing these enhancements:

1. **JWT Decode Fallback**
   - Implement lightweight JWT decoding as a fallback when Supabase auth fails
   - Add npm package: `jsonwebtoken`
   - Create utility function for token decoding

2. **Session Persistence Enhancement**
   - Improve cookie handling for session persistence
   - Consider using localStorage backup for session information

3. **Unified Authentication Error Handling**
   - Create a central error handler for authentication issues
   - Standardize error messages and logging format

## Documentation

Keep these documents updated when making authentication changes:

- `docs/auth-session-troubleshooting.md`
- `docs/authentication-fixes.md`
- `docs/auth-troubleshooting.md`
- `README.md` (Authentication section)

## Key Contacts

For complex authentication issues, contact:

- Supabase Support: [https://supabase.com/support](https://supabase.com/support)
- Next.js Auth Documentation: [https://nextjs.org/docs/authentication](https://nextjs.org/docs/authentication) 