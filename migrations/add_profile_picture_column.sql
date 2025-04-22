-- Add profile_picture_url column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Function to create a storage policy for a bucket
-- This allows our frontend to create policies without needing admin privileges
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

-- Create profile_pictures storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile_pictures', 'profile_pictures', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for profile_pictures bucket
-- This policy allows authenticated users to upload their own profile pictures
INSERT INTO storage.policies (name, bucket_id, allowed_mime_types, definition)
VALUES (
  'Avatar Upload Policy',
  'profile_pictures',
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  '(auth.uid() IS NOT NULL)'
)
ON CONFLICT (name, bucket_id) DO NOTHING;

-- Create policy that allows users to only upload to their own folder
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'User Folder Policy',
  'profile_pictures',
  'storage.foldername(storage.filename()) = auth.uid()'
)
ON CONFLICT (name, bucket_id) DO NOTHING;

-- Create policy allowing users to read any profile pictures
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Public Read Policy',
  'profile_pictures',
  'true'
)
ON CONFLICT (name, bucket_id) DO NOTHING;

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

-- Comment explaining the migration
COMMENT ON COLUMN profiles.profile_picture_url IS 'URL to the user''s profile picture stored in Supabase Storage'; 