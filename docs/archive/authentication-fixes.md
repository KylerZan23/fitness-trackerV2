# Authentication and Profile Creation Fixes

This document explains the fixes implemented to address authentication and profile creation issues in the Fitness Tracker application.

## Issues Addressed

1. **RLS Policy Enforcement**: Ensuring the correct Row Level Security (RLS) policies are set for the profiles table.
2. **Token Verification**: Improving the server-side API to better handle and verify auth tokens.
3. **Timing Issues**: Addressing potential timing issues with session establishment and token availability.

## Fix 1: RLS Policy Verification

We verified and reset the RLS policies on the profiles table to ensure they're correctly configured:

```sql
-- Drop existing RLS policies on profiles table to reset them
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Ensure Row Level Security is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create policy to allow insert during signup
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

These policies ensure that:

- Users can only view their own profile (`auth.uid() = id`)
- Users can only update their own profile
- Users can only create a profile with their own ID

## Fix 2: Enhanced Server-Side API Logging

We improved the `/api/create-profile` route with detailed logging to help diagnose token verification issues:

1. Added logging for request data (ID, email, token availability)
2. Added better error handling for token verification
3. Added detailed error messages for specific failure cases:
   - Missing user ID or email
   - Invalid token
   - User ID mismatch between token and request
   - Service role key configuration issues

### Critical Improvement: Service Role for Token Verification

A key improvement is switching from an anonymous client to a service role client for token verification:

```typescript
// Before: Using anonymous client for verification (less secure)
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// After: Using service role client for verification (more secure)
const supabaseVerify = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

This change ensures more reliable token verification and provides better security when validating user tokens. We've also added try/catch blocks to handle potential errors during the token verification process.

## Fix 3: Login Page Improvements

We enhanced the login process to better handle profile creation:

1. Added a delay before calling the server-side API to ensure the session is fully established
2. Added logging to verify access token availability
3. Improved error messaging when profile creation fails
4. Better error state handling for user feedback

## Testing the Fixes

1. Apply the migrations:

   ```bash
   npx supabase migration up
   ```

2. If you don't have local Supabase setup with Docker, apply the SQL manually in the Supabase Dashboard:

   a. Navigate to your Supabase project dashboard
   b. Go to the "SQL Editor" section
   c. Create a new query and paste the following SQL:

   ```sql
   -- Drop existing RLS policies on profiles table to reset them
   DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
   DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
   DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

   -- Ensure Row Level Security is enabled
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

   -- Create policy to allow users to view their own profile
   CREATE POLICY "Users can view own profile"
     ON profiles FOR SELECT
     USING (auth.uid() = id);

   -- Create policy to allow users to update their own profile
   CREATE POLICY "Users can update own profile"
     ON profiles FOR UPDATE
     USING (auth.uid() = id)
     WITH CHECK (auth.uid() = id);

   -- Create policy to allow insert during signup
   -- This policy is critical for allowing users to create their own profiles
   CREATE POLICY "Users can insert own profile"
     ON profiles FOR INSERT
     WITH CHECK (auth.uid() = id);
   ```

   d. Run the query

3. Test the login flow after applying the fixes:

   - Sign out completely
   - Sign in with valid credentials
   - Check browser console for logs showing successful profile creation
   - Verify you can access the dashboard

4. Check Database:
   - Verify profile exists in Supabase

## Additional Recommendations

1. **Security Best Practices**:

   - Always verify authentication tokens on the server side
   - Keep RLS policies up-to-date with business rules
   - Use the service role key only for admin functions
   - Consider implementing a dedicated admin role for managing users

2. **Debugging Tips**:

   - Add detailed logging in authentication-related code
   - Check browser console for error messages
   - Use the Network tab to inspect API responses
   - Verify token expiration and validity

3. **Performance Considerations**:

   - Consider caching user profiles client-side
   - Minimize token verification overhead where possible
   - Use batch operations for multiple database changes

4. **RLS Policy Testing**:
   - Use the provided RLS testing script to verify policies are working correctly:
     ```bash
     yarn test:rls
     ```
   - This script tests critical operations on the profiles table:
     - Inserting own profile
     - Selecting own profile
     - Attempting to select other profiles (should fail)
     - Updating own profile
   - Run this test after any changes to RLS policies
