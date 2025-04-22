-- Complete Profile Picture Setup Migration
-- Run this file in your Supabase SQL Editor to set up all the required components
-- for the profile picture functionality

--------------------------------------------------
-- 1. Add the profile_picture_url column if needed
--------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

--------------------------------------------------
-- 2. Create the add_profile_picture_column function
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
-- 3. Create the update_profile_picture function
--------------------------------------------------
CREATE OR REPLACE FUNCTION update_profile_picture(
  user_id UUID,
  picture_url TEXT
) RETURNS VOID AS $$
BEGIN
  -- Ensure the column exists
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
  
  -- Update the profile
  UPDATE profiles 
  SET profile_picture_url = picture_url 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION update_profile_picture TO authenticated;
GRANT EXECUTE ON FUNCTION update_profile_picture TO anon;
GRANT EXECUTE ON FUNCTION update_profile_picture TO service_role;

--------------------------------------------------
-- 4. Storage Bucket Setup (Optional for Data URIs)
--------------------------------------------------
-- Uncomment and run this section if you want to use Supabase Storage
-- instead of data URIs for profile pictures

/*
-- Check if bucket exists before creating
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'avatars'
  ) INTO bucket_exists;
  
  IF NOT bucket_exists THEN
    -- Create the avatars bucket with public access
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', TRUE);
  
    -- Create policy to allow authenticated users to upload avatars
    INSERT INTO storage.policies (name, bucket_id, allowed_mime_types, definition)
    VALUES (
      'Avatar Upload Policy',
      'avatars',
      ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      '(auth.uid() IS NOT NULL)'
    );
  
    -- Create policy for public read access
    INSERT INTO storage.policies (name, bucket_id, definition)
    VALUES (
      'Public Read Policy',
      'avatars',
      'true'
    );
  END IF;
END $$;
*/

--------------------------------------------------
-- 5. Check if migrations were successful
--------------------------------------------------
DO $$
DECLARE
  column_exists BOOLEAN;
  add_function_exists BOOLEAN;
  update_function_exists BOOLEAN;
BEGIN
  -- Check if profile_picture_url column exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'profile_picture_url'
  ) INTO column_exists;
  
  -- Check if add_profile_picture_column function exists
  SELECT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'add_profile_picture_column'
  ) INTO add_function_exists;
  
  -- Check if update_profile_picture function exists
  SELECT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'update_profile_picture'
  ) INTO update_function_exists;
  
  -- Output results
  RAISE NOTICE 'Migration status:';
  RAISE NOTICE 'profile_picture_url column: %', CASE WHEN column_exists THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE 'add_profile_picture_column function: %', CASE WHEN add_function_exists THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE 'update_profile_picture function: %', CASE WHEN update_function_exists THEN 'EXISTS' ELSE 'MISSING' END;
END $$; 