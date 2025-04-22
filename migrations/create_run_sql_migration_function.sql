-- Function to run SQL migrations with proper permissions
-- This function allows users with admin role to run SQL migrations from the client side
-- It should be used with caution as it allows executing arbitrary SQL

-- First, create a secure helper function that performs the check for admin role
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

-- Now create the main function to run SQL migrations
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