-- Consolidate Migration Utility Functions
-- This migration consolidates all utility functions for migrations and database operations

--------------------------------------------------
-- 1. Admin role checking function
--------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get the role from the profiles table for the current user
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();
  
  -- Return true if the user is an admin
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission on the helper function
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated;

--------------------------------------------------
-- 2. SQL migration runner function
--------------------------------------------------
CREATE OR REPLACE FUNCTION run_sql_migration(
  sql_script TEXT,
  migration_name TEXT DEFAULT 'Custom Migration'
)
RETURNS VOID AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'Permission denied: Only users with admin role can run SQL migrations';
  END IF;
  
  -- Log the migration attempt
  RAISE NOTICE 'Running migration "%": Executed by user %', 
    migration_name, auth.uid();
  
  -- Execute the SQL script
  EXECUTE sql_script;
  
  -- Log success
  RAISE NOTICE 'Migration "%" completed successfully', migration_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission only to authenticated users
GRANT EXECUTE ON FUNCTION run_sql_migration(TEXT, TEXT) TO authenticated;

--------------------------------------------------
-- 3. Add profile picture column function
--------------------------------------------------
CREATE OR REPLACE FUNCTION add_profile_picture_column()
RETURNS VOID AS $$
BEGIN
  -- Check if the column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'profile_picture_url'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE profiles ADD COLUMN profile_picture_url TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION add_profile_picture_column() TO authenticated;
GRANT EXECUTE ON FUNCTION add_profile_picture_column() TO anon;
GRANT EXECUTE ON FUNCTION add_profile_picture_column() TO service_role;

--------------------------------------------------
-- 4. Storage policy creation function
--------------------------------------------------
CREATE OR REPLACE FUNCTION create_storage_policy(
  bucket_name TEXT,
  policy_name TEXT,
  definition TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  policy_exists BOOLEAN;
BEGIN
  -- Check if the policy already exists
  SELECT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE name = policy_name AND bucket_id = bucket_name
  ) INTO policy_exists;
  
  -- If policy doesn't exist, create it
  IF NOT policy_exists THEN
    -- Insert the new policy
    INSERT INTO storage.policies (name, bucket_id, definition)
    VALUES (policy_name, bucket_name, definition);
    
    RETURN TRUE;
  END IF;
  
  -- Policy already exists
  RETURN FALSE;
EXCEPTION
  WHEN OTHERS THEN
    -- Return false on error
    RAISE NOTICE 'Error creating policy: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow roles to access the function
GRANT EXECUTE ON FUNCTION create_storage_policy TO authenticated;
GRANT EXECUTE ON FUNCTION create_storage_policy TO anon;
GRANT EXECUTE ON FUNCTION create_storage_policy TO service_role;
