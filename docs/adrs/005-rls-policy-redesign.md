# ADR 005: Row Level Security Policy Redesign

## Status
Accepted

## Date
2023-06-30

## Context
The application was experiencing authentication issues where users could not create profiles during the signup process due to Row Level Security (RLS) policies that were not properly allowing users to insert their own profiles. This resulted in:

1. Users being authenticated but unable to create profiles
2. RLS policy violations during profile creation
3. Fallback to server-side API also failing due to incorrect RLS permissions
4. Inconsistent user experience during the signup/login flow

## Decision
We have decided to redesign the Row Level Security policies for the profiles table to ensure:

1. Users can create their own profiles during signup (INSERT)
2. Users can view only their own profiles (SELECT)
3. Users can update only their own profiles (UPDATE)

The RLS policies are now designed to use the `auth.uid()` function to verify the authenticated user's ID matches the profile ID being operated on.

**New RLS Policies:**
```sql
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

Additionally, we've enhanced the server-side API for profile creation to include detailed logging for better error tracking and troubleshooting of authentication token verification issues.

## Consequences

### Positive
- Users can now successfully create profiles during signup
- Improved security with proper RLS enforcement
- Better debug logging for troubleshooting authentication issues
- Clear separation of concerns between client-side and server-side profile creation
- More robust authentication flow

### Negative
- More complex authentication flow with fallback mechanisms
- Additional overhead for detailed logging
- Need for careful testing when making future changes to RLS policies

### Neutral
- Need to maintain backward compatibility with existing profiles
- Additional documentation required for future developers

## References
- [Authentication Fixes Documentation](../authentication-fixes.md)
- [Authentication Troubleshooting Guide](../auth-troubleshooting.md) 