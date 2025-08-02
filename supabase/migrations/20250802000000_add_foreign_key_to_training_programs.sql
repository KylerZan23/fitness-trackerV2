-- Migration: Add foreign key constraint to training_programs table
-- This migration adds the missing foreign key relationship between the
-- training_programs table and the profiles table. This is necessary for
-- Supabase to correctly perform joins between these two tables.

-- Add the foreign key constraint to the user_id column
ALTER TABLE public.training_programs
ADD CONSTRAINT fk_user_id
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Add a comment to describe the relationship
COMMENT ON CONSTRAINT fk_user_id ON public.training_programs IS 'Ensures that every training program is linked to a valid user profile.';
