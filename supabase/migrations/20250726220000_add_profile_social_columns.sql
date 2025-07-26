-- Migration: Add social profile columns for modern profile page
-- This migration adds missing columns that are being queried by the profile page

-- Add professional_title column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS professional_title TEXT;

-- Add bio column  
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add height and weight columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS height_cm INTEGER;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,2);

-- Add birth_date column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Add profile_picture_url column (if not already exists from other migrations)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add onboarding completion tracking (if not already exists)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_profiles_professional_title ON public.profiles(professional_title);
CREATE INDEX IF NOT EXISTS idx_profiles_birth_date ON public.profiles(birth_date);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.professional_title
IS 'User''s professional title for social profile display';

COMMENT ON COLUMN public.profiles.bio
IS 'User''s biography/description for social profile';

COMMENT ON COLUMN public.profiles.height_cm
IS 'User''s height in centimeters';

COMMENT ON COLUMN public.profiles.weight_kg
IS 'User''s weight in kilograms';

COMMENT ON COLUMN public.profiles.birth_date
IS 'User''s birth date for age calculation';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration to add social profile columns completed successfully.';
END $$; 