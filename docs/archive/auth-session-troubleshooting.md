# Auth Session Missing Troubleshooting Guide

This guide provides steps to diagnose and resolve the "Auth session missing!" error during profile creation.

## Understanding the Error

The "Auth session missing!" error typically occurs when:

1. The authentication token cannot be verified on the server side
2. The token is invalid, expired, or malformed
3. There is a timing issue between token creation and verification
4. The environment variables for authentication are misconfigured

## Diagnose with Enhanced Logging

We've added comprehensive logging to both client and server components. Look for these log patterns:

### Client-side Logs (Browser Console)

1. Check if the session exists on the client before API call:

   ```
   Verified session exists: true
   Session user ID: [user-id]
   Session expiry: [timestamp]
   ```

2. Check token information:

   ```
   Using token from verified session: true
   Token length: [number]
   ```

3. Check for specific error patterns:
   ```
   Auth session missing detected - this suggests token verification issues
   ```

### Server-side Logs (Terminal)

1. Check token verification start:

   ```
   API - Profile Creation: Starting token verification with token length: [number]
   API - Profile Creation: First 10 chars of token: [chars]...
   ```

2. Check for successful setSession call:

   ```
   API - Profile Creation: setSession call completed without errors
   ```

3. Check for user data:

   ```
   API - Profile Creation: User from getUser: {"id":"...","email":"..."}
   ```

4. Look for detailed error information:
   ```
   API - Profile Creation: Complete error object: {...}
   ```

## Step-by-Step Resolution

1. **Verify environment variables**

   - Check that `SUPABASE_SERVICE_ROLE_KEY` is set correctly in `.env.local`
   - Verify that the key has the correct format
   - Restart the server after any changes to environment variables

2. **Increase token propagation delay**

   - If the issue persists, try increasing the delay in `login/page.tsx` from 1500ms to 3000ms
   - This gives more time for the token to fully propagate

3. **Check Supabase project configuration**

   - Verify CORS settings in the Supabase dashboard (Project Settings > API)
   - Ensure the project URL matches your `NEXT_PUBLIC_SUPABASE_URL`

4. **Test in incognito/private browsing mode**

   - This eliminates caching issues or conflicts with browser extensions

5. **Check network requests**

   - Use browser Dev Tools > Network tab
   - Look for the POST request to `/api/create-profile`
   - Check request headers and payload
   - Examine the response for detailed error information

6. **Server-side debugging**
   - Set a breakpoint in the API route using `debugger` statement
   - Run Next.js in debug mode: `NODE_OPTIONS='--inspect' next dev`
   - Connect Chrome DevTools to the Node.js process

## Workaround Solutions

If the issue persists, you can try these workarounds:

1. **Create profile during signup instead of login**

   - Modify the signup flow to create the profile immediately
   - This avoids timing issues with session verification

2. **Use a JWT token utility**

   - Implement a custom JWT verification instead of relying on Supabase's auth.getUser()
   - Example: `const jwt = require('jsonwebtoken'); const decoded = jwt.verify(token, SECRET_KEY);`

3. **Bypass token verification temporarily**
   - For testing only, you can disable the token verification requirement
   - NOT recommended for production!

## After Fixing

Once the issue is resolved:

1. Run through the complete login flow
2. Verify the profile creation works without errors
3. Check that the profile data appears in the dashboard
4. Document any changes made to fix the issue

## Advanced Debugging Tools

### Token Verification Test Script

We've created a standalone script to test token verification independently of the application:

1. **Get a valid token from the browser:**

   - Login to the application
   - Open browser console (F12)
   - Run this in the console:
     ```javascript
     const { data } = await supabase.auth.getSession()
     console.log(data.session.access_token)
     ```
   - Copy the token output

2. **Run the verification script:**

   ```bash
   # First install dotenv if not already installed
   yarn add dotenv

   # Then run the test script with your token
   node scripts/test-token.js YOUR_TOKEN_HERE
   ```

3. **Analyze the output:**

   - If verification succeeds, but profile creation still fails, the issue is likely with:
     - RLS policies
     - API route implementation
     - Request timing
   - If verification fails with "Auth session missing", the issue is with:
     - Token format
     - Environment variables
     - Supabase configuration

This script can help isolate whether the issue is with token verification or with another part of the profile creation process.

## Need More Help?

If the issue persists despite following this guide, please:

1. Gather all client and server logs
2. Note any changes made to the authentication flow
3. Document the exact steps to reproduce the issue
4. Contact the development team for further assistance
