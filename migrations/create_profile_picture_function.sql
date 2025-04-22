-- Function to update a user's profile picture in a way that bypasses schema cache issues
CREATE OR REPLACE FUNCTION update_profile_picture(
  user_id UUID,
  picture_url TEXT
) RETURNS VOID AS $$
BEGIN
  -- First, make sure the profile_picture_url column exists
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
  
  -- Then update the user's profile
  UPDATE profiles 
  SET profile_picture_url = picture_url 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow authenticated users to call this function
GRANT EXECUTE ON FUNCTION update_profile_picture TO authenticated;
GRANT EXECUTE ON FUNCTION update_profile_picture TO anon;
GRANT EXECUTE ON FUNCTION update_profile_picture TO service_role; 