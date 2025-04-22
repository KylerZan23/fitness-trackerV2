# ADR 001: Self-Healing Database Schema for Profile Pictures

## Date: 2023-07-10

## Status

Accepted

## Context

The application's profile picture upload functionality encountered a schema cache issue where the `profile_picture_url` column existed in the database but was not recognized by the Supabase client due to schema cache inconsistencies. This led to errors like "Could not find the 'profile_picture_url' column of 'profiles' in the schema cache" when users attempted to upload profile pictures.

Traditional approaches would require administrators to manually run SQL commands to fix the schema, which creates a poor user experience and increases support requirements.

## Decision

We've implemented a self-healing database schema approach with the following components:

1. **Automatic Schema Detection:** The `ProfilePictureUpload` component automatically detects if the required column exists by attempting to access it and handling the resulting error patterns.

2. **User-Initiated Fix Button:** When a schema issue is detected, a "Fix Database" button appears in the UI allowing users to resolve the issue themselves without technical knowledge.

3. **RPC Function Approach:** Instead of relying on direct SQL operations that could be affected by schema cache issues, we use PostgreSQL stored functions (RPCs) that:
   - Check if the column exists
   - Add the column if needed
   - Update the data as needed

4. **Fallback Mechanisms:** The implementation includes multiple fallback approaches:
   - Try RPC function first
   - Fall back to direct updates if needed
   - Use data URIs instead of storage buckets if needed

5. **Comprehensive SQL Migration:** We provide a complete SQL migration that sets up all required components in one operation.

## Consequences

### Positive

- **Improved User Experience:** Users can fix database issues directly from the UI without technical support
- **Reduced Support Load:** Fewer support tickets for schema-related issues
- **Self-Healing System:** The application can recover from certain types of database inconsistencies
- **Versatile Storage Options:** Support for both Supabase Storage and Data URIs provides deployment flexibility

### Negative

- **Increased Complexity:** The self-healing approach adds complexity to the codebase
- **Security Considerations:** SECURITY DEFINER functions need careful access control
- **Performance Impact:** Data URIs increase database size compared to storage buckets
- **Additional Database Objects:** The solution requires maintaining additional database functions

## Alternatives Considered

1. **Manual SQL Only:** Require administrators to run SQL commands manually
   - Rejected due to poor user experience and increased support requirements

2. **Server-Side Only Fix:** Implement server-side APIs to fix the schema
   - Rejected due to added complexity and authentication requirements

3. **Rebuild Schema Cache:** Force schema cache refresh
   - Rejected because the Supabase client doesn't expose this capability directly

4. **Simplified Schema:** Remove the column and use only storage URLs
   - Rejected because it would require a more complex migration for existing users

## Implementation Notes

The implementation includes:

1. A React component (`ProfilePictureUpload.tsx`) that handles:
   - Detecting schema issues
   - Displaying the Fix Database button
   - Calling the RPC functions
   - Providing feedback to users

2. SQL functions:
   - `add_profile_picture_column()`: Adds the column if it doesn't exist
   - `update_profile_picture(user_id, picture_url)`: Updates the profile while handling schema issues

3. Documentation:
   - `docs/profile-picture-fix.md`: Comprehensive troubleshooting guide
   - `migrations/profile_picture_complete_setup.sql`: Full SQL setup script 