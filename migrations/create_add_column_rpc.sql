-- Function to add the profile_picture_url column to profiles table
-- This can be called from the client side to fix schema issues

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