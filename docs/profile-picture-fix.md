# Profile Picture Upload - Troubleshooting

This document covers known issues with the profile picture upload feature and how to resolve them.

## Common Errors

### 1. "Bucket not found" Error

If you see an error message about a bucket not being found, it means the `avatars` storage bucket has not been created in Supabase.

### 2. "Could not find the 'profile_picture_url' column of 'profiles' in the schema cache."

This error means the database schema cache does not recognize the `profile_picture_url` column, even if it exists in the database.

## Resolving Schema Cache Issues

### Using the UI Fix Button

The latest version of the app includes a "Fix Database" button that will appear automatically when schema issues are detected. 

1. Simply click the "Fix Database" button that appears below the profile picture upload area
2. The app will attempt to fix the database schema by:
   - Running an RPC function to add the column if it doesn't exist
   - Refreshing the schema cache
   - Reloading the page

If the button doesn't appear or doesn't resolve the issue, try the manual solutions below.

### Admin Tools (For Administrators)

Users with administrator privileges can access advanced database tools:

1. Log in with an admin account
2. Navigate to the Profile page
3. Scroll down to the "Admin Tools" section
4. Use the "Profile Database Fix" tool to:
   - Add the `profile_picture_url` column
   - Create all necessary database functions
   - Run complete schema migrations

To set a user as an administrator, run the following SQL in your Supabase SQL Editor:

```sql
UPDATE profiles
SET role = 'admin'
WHERE id = 'YOUR_USER_ID';
```

### SQL Solution

Run the following SQL in your Supabase SQL Editor to create a function that updates the profile picture while handling schema issues:

```sql
-- Create a function to update profile picture that handles schema issues
CREATE OR REPLACE FUNCTION update_profile_picture(
  user_id UUID,
  picture_url TEXT
) RETURNS VOID AS $$
BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
  UPDATE profiles 
  SET profile_picture_url = picture_url 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_profile_picture TO authenticated;
GRANT EXECUTE ON FUNCTION update_profile_picture TO anon;
GRANT EXECUTE ON FUNCTION update_profile_picture TO service_role;
```

### Temporary Data URI Approach

The app currently uses data URIs to store profile pictures directly in the database. This approach has:

**Benefits:**
- Works immediately without requiring storage bucket setup
- No additional configuration needed

**Drawbacks:**
- Increases database size
- May impact performance with large images
- Not ideal for production use with many users

## Setting Up Storage Bucket Manually

For a production environment, it's recommended to set up a proper storage bucket:

1. Go to your Supabase project dashboard
2. Navigate to Storage → Buckets
3. Create a new bucket named `avatars` 
4. Set access control to "Public"
5. Create policies to allow authenticated users to upload files:

**Upload Policy:**
- Name: "Avatar Upload Policy" 
- Allowed operation: INSERT
- For authenticated users: `(auth.uid() IS NOT NULL)`

**Read Policy:**
- Name: "Public Read Policy"
- Allowed operation: SELECT
- For all users: `true`

## Full SQL Migration

If you need to set up everything at once, you can run this complete script:

```sql
-- 1. Add profile_picture_url column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- 2. Create a function to add the column if needed (can be called from client)
CREATE OR REPLACE FUNCTION add_profile_picture_column()
RETURNS VOID AS $$
BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION add_profile_picture_column() TO authenticated;
GRANT EXECUTE ON FUNCTION add_profile_picture_column() TO anon;
GRANT EXECUTE ON FUNCTION add_profile_picture_column() TO service_role;

-- 3. Create a function to update profile pictures while handling schema issues
CREATE OR REPLACE FUNCTION update_profile_picture(
  user_id UUID,
  picture_url TEXT
) RETURNS VOID AS $$
BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
  UPDATE profiles 
  SET profile_picture_url = picture_url 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_profile_picture TO authenticated;
GRANT EXECUTE ON FUNCTION update_profile_picture TO anon;
GRANT EXECUTE ON FUNCTION update_profile_picture TO service_role;
``` 