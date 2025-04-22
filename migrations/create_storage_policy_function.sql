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