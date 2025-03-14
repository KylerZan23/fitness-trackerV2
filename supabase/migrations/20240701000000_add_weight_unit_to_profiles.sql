-- Add weight_unit column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS weight_unit VARCHAR(3) DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs'));

-- Update existing profiles to have the default weight unit
UPDATE profiles SET weight_unit = 'kg' WHERE weight_unit IS NULL;

COMMENT ON COLUMN profiles.weight_unit IS 'User preference for weight unit (kg or lbs)'; 