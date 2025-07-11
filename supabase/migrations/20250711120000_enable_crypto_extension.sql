-- Enable the pgcrypto extension if it's not already enabled
-- This provides functions like uuid_generate_v4() needed for primary keys.
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'pgcrypto extension enabled successfully.';
END $$; 