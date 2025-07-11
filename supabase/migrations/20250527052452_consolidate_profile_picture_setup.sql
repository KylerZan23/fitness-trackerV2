-- Consolidate Profile Picture Setup Migration
-- This migration consolidates all profile picture functionality from separate files

--------------------------------------------------
-- 1. Add the profile_picture_url column
--------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Comment explaining the column
COMMENT ON COLUMN profiles.profile_picture_url IS 'URL to the user''s profile picture stored in Supabase Storage';

--------------------------------------------------
-- 2. Create profile picture update function
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
-- 3. Create add_profile_picture_column function
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
-- 4. Storage bucket and policies setup
--------------------------------------------------
-- Create profile_pictures storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile_pictures', 'profile_pictures', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Function to create storage policies
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

-- Create storage policies for profile_pictures bucket
-- This policy allows authenticated users to upload their own profile pictures
-- INSERT INTO storage.policies (name, bucket_id, allowed_mime_types, definition)
-- VALUES (
--   'Avatar Upload Policy',
--   'profile_pictures',
--   ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
--   '(auth.uid() IS NOT NULL)'
-- )
-- ON CONFLICT (name, bucket_id) DO NOTHING;

-- Create policy that allows users to only upload to their own folder
-- INSERT INTO storage.policies (name, bucket_id, definition)
-- VALUES (
--   'User Folder Policy',
--   'profile_pictures',
--   'storage.foldername(storage.filename()) = auth.uid()'
-- )
-- ON CONFLICT (name, bucket_id) DO NOTHING;

-- Create policy allowing users to read any profile pictures
-- INSERT INTO storage.policies (name, bucket_id, definition)
-- VALUES (
--   'Public Read Policy',
--   'profile_pictures',
--   'true'
-- )
-- ON CONFLICT (name, bucket_id) DO NOTHING;

--------------------------------------------------
-- 5. RLS policies for profiles table
--------------------------------------------------
-- Add RLS policy to allow users to update their own profile_picture_url
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'update_own_profile_picture'
  ) THEN
    CREATE POLICY update_own_profile_picture ON profiles
      FOR UPDATE TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

--------------------------------------------------
-- 6. Verification check
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
  RAISE NOTICE 'Profile Picture Migration status:';
  RAISE NOTICE 'profile_picture_url column: %', CASE WHEN column_exists THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE 'add_profile_picture_column function: %', CASE WHEN add_function_exists THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE 'update_profile_picture function: %', CASE WHEN update_function_exists THEN 'EXISTS' ELSE 'MISSING' END;
END $$;
